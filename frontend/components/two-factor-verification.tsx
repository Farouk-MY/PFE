// components/two-factor-verification.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";

interface TwoFactorVerificationProps {
    email: string;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({ email }) => {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
    const { verifyTwoFactorToken, error, isAuthenticated, clearError } = useAuthStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Focus the input field when component mounts or mode changes
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        // Clear any previous errors when mounting or switching modes
        clearError();
    }, [isUsingBackupCode, clearError]);

    // Monitor authentication state and redirect if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            toast.success("Successfully verified! Redirecting to home page...");
            // Add a small delay to ensure state is fully updated
            setTimeout(() => {
                router.push("/");
                // Use router.replace as a fallback if push doesn't work
                setTimeout(() => {
                    if (window.location.pathname.includes("/auth")) {
                        window.location.href = "/";
                    }
                }, 500);
            }, 100);
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyTwoFactorToken(email, token, isUsingBackupCode);

            // Check if verification was successful
            const currentState = useAuthStore.getState();
            if (currentState.isAuthenticated) {
                toast.success("Successfully verified! Redirecting to home page...");
                // Force navigation to homepage
                router.push("/");
                // Fallback redirect
                setTimeout(() => {
                    window.location.href = "/";
                }, 300);
            } else if (currentState.error) {
                toast.error(currentState.error);
                setToken(""); // Clear the input on error
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
        } catch (error: any) {
            console.error("2FA verification error:", error);
            toast.error(error.message || "Failed to verify two-factor authentication");
            setToken(""); // Clear the input on error
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle digit inputs for better UX
    const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // For regular 2FA codes, only allow digits and limit to 6 characters
        if (!isUsingBackupCode) {
            const onlyDigits = value.replace(/[^\d]/g, "");
            setToken(onlyDigits.substring(0, 6));

            // Auto-submit when 6 digits are entered
            if (onlyDigits.length === 6) {
                setToken(onlyDigits);
                setTimeout(() => {
                    if (formRef.current) {
                        formRef.current.dispatchEvent(
                            new Event('submit', { cancelable: true, bubbles: true })
                        );
                    }
                }, 300);
            }
        } else {
            // For backup codes, allow alphanumeric characters
            setToken(value);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center space-y-4 pb-4 pt-8">
                <div className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 p-3 dark:from-blue-900/40 dark:to-purple-900/40">
                    {isUsingBackupCode ? (
                        <KeyRound className="size-10 text-amber-500" />
                    ) : (
                        <ShieldCheck className="size-10 text-blue-500" />
                    )}
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold">Two-Factor Verification</h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        {isUsingBackupCode
                            ? "Enter a backup code from your saved backup codes list"
                            : "Enter the 6-digit code from your authenticator app"
                        }
                    </p>
                    <div className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 rounded-full px-3 py-1 inline-block">
                        {email}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-3 mb-4 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400 mx-6">
                    {error}
                </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 px-6 pb-8">
                <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm font-medium">
                        {isUsingBackupCode ? "Backup Code" : "Authentication Code"}
                    </Label>

                    {isUsingBackupCode ? (
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                id="token"
                                ref={inputRef}
                                type="text"
                                placeholder="Enter your backup code"
                                value={token}
                                onChange={handleTokenChange}
                                className="h-10 pl-10 text-base font-mono"
                                autoComplete="off"
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-center">
                                <div className="relative w-full">
                                    <Smartphone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        id="token"
                                        ref={inputRef}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={token}
                                        onChange={handleTokenChange}
                                        className="h-12 pl-10 text-center text-xl tracking-widest font-mono"
                                        autoComplete="off"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="flex gap-1.5 mt-2">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`size-2.5 rounded-full ${
                                                i < token.length
                                                    ? 'bg-blue-500'
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                            {!isUsingBackupCode && token.length > 0 && (
                                <span>{token.length}/6 digits</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsUsingBackupCode(!isUsingBackupCode);
                                setToken("");
                            }}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {isUsingBackupCode
                                ? "Use authentication code instead"
                                : "Use backup code instead"}
                        </button>
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        className="h-11 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium hover:opacity-90 dark:from-blue-500 dark:to-purple-500"
                        disabled={loading || (token.length === 0) || (!isUsingBackupCode && token.length < 6)}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg
                                    className="-ml-1 mr-2 size-4 animate-spin text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                Verify & Continue
                                <ArrowRight className="ml-2 size-4" />
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </>
    );
};