"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useAuthStore } from "@/store";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, LucideSparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { TwoFactorVerification } from "@/components/two-factor-verification";
import { useTranslation } from "react-i18next";
import '@/i18n';

export default function SignInPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation(['auth']);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, error, clearError, requireTwoFactor, twoFactorEmail } = useAuthStore();
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  // Theme toggle workaround for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);

      // Check current state after login attempt
      const currentState = useAuthStore.getState();

      if (currentState.requireTwoFactor) {
        // The 2FA verification component will handle this state
        toast.info("Two-factor authentication required");
        setLoading(false);
        return;
      } else if (currentState.error) {
        // Handle the error from the auth store
        toast.error(currentState.error);
      } else if (currentState.isAuthenticated) {
        // Only show success and redirect if we're actually authenticated
        toast.success("Successfully signed in!");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  // Handler for opening the reset password modal
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setResetPasswordOpen(true);
  };

  // Render the right content based on authentication state
  const renderContent = () => {
    if (requireTwoFactor && twoFactorEmail) {
      return <TwoFactorVerification email={twoFactorEmail} />;
    }

    return (
        <>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-medium">{t('auth:signin.title')}</CardTitle>
            <CardDescription>
              {t('auth:signin.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
                <div className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  {t('auth:signin.emailLabel')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                      id="email"
                      type="email"
                      placeholder={t('auth:signin.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-9 pl-8 text-sm"
                      required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    {t('auth:signin.passwordLabel')}
                  </Label>
                  <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t('auth:signin.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                      id="password"
                      type="password"
                      placeholder={t('auth:signin.passwordPlaceholder')}
                      value={formData.password}
                      onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-9 pl-8 text-sm"
                      required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                    type="submit"
                    className="h-9 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm hover:opacity-90 dark:from-blue-500 dark:to-purple-500"
                    disabled={loading}
                >
                  {loading ? (
                      <span className="flex items-center">
                    <svg
                        className="-ml-1 mr-2 size-3.5 animate-spin text-white"
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
                    {t('auth:signin.signingIn', 'Signing in...')}
                  </span>
                  ) : (
                      <span className="flex items-center justify-center">
                    {t('auth:signin.submitButton')}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pb-4 pt-0">
            <div className="text-center text-xs text-muted-foreground">
              {t('auth:signin.noAccount')}{" "}
              <Link
                  href="/auth/signup"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('auth:signin.signupLink')}
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {t('auth:signin.termsText', 'By signing in, you agree to our')}{" "}
              <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
              >
                {t('auth:signin.terms', 'Terms')}
              </Link>{" "}
              {t('auth:signin.and', 'and')}{" "}
              <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
              >
                {t('auth:signin.privacyPolicy', 'Privacy Policy')}
              </Link>
              .
            </p>
          </CardFooter>
        </>
    );
  };

  return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 p-4 transition-colors duration-300 dark:from-blue-950 dark:to-purple-950">
        {/* Tech-themed animated background */}
        <div className="absolute inset-0 overflow-hidden opacity-50 dark:opacity-30">
          {/* Circuit board patterns */}
          <svg
              className="absolute left-0 top-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
          >
            <pattern
                id="circuit-pattern"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
            >
              <path
                  d="M 10 0 L 7 0 L 7 7 L 0 7 L 0 10 L 10 10 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-blue-300 dark:text-blue-700"
              />
            </pattern>
            <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#circuit-pattern)"
            />
          </svg>

          {/* Floating tech elements */}
          <div className="absolute left-10 top-10">
            <motion.div
                animate={{ y: [0, 15, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="size-12 rounded-lg border border-blue-200 bg-blue-100/50 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-900/30"
            />
          </div>
          <div className="absolute right-20 top-20">
            <motion.div
                animate={{ y: [0, -20, 0], opacity: [0.5, 0.9, 0.5] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="size-16 rounded-full border border-purple-200 bg-purple-100/50 backdrop-blur-sm dark:border-purple-800 dark:bg-purple-900/30"
            />
          </div>
          <div className="absolute bottom-20 left-1/4">
            <motion.div
                animate={{ x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
                className="h-8 w-20 rounded-lg border border-indigo-200 bg-indigo-100/50 backdrop-blur-sm dark:border-indigo-800 dark:bg-indigo-900/30"
            />
          </div>
          <div className="absolute bottom-40 right-1/4">
            <motion.div
                animate={{ x: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3,
                }}
                className="size-10 rounded-lg border border-cyan-200 bg-cyan-100/50 backdrop-blur-sm dark:border-cyan-800 dark:bg-cyan-900/30"
            />
          </div>

          {/* Decorative dots grid */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-8 p-8">
            {Array.from({ length: 72 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="size-1 rounded-full bg-blue-400/30 dark:bg-blue-500/30"
                    animate={{
                      scale: [1, Math.random() * 0.5 + 1.5, 1],
                      opacity: [0.3, Math.random() * 0.3 + 0.7, 0.3],
                    }}
                    transition={{
                      duration: Math.random() * 2 + 3,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    }}
                />
            ))}
          </div>

          {/* Digital code lines */}
          <motion.div
              className="absolute bottom-0 left-0 h-40 w-full opacity-10"
              animate={{ opacity: [0.05, 0.1, 0.05] }}
              transition={{ duration: 5, repeat: Infinity }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="h-px bg-gradient-to-r from-blue-400 via-purple-400 to-transparent"
                    style={{
                      marginTop: `${i * 4}px`,
                      width: `${Math.random() * 50 + 50}%`,
                    }}
                />
            ))}
          </motion.div>

          {/* Floating binary code */}
          <div className="absolute left-1/4 top-1/4 font-mono text-xs text-blue-500/20 dark:text-blue-400/20">
            <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 8, repeat: Infinity }}
            >
              10100111
              <br />
              01010001
              <br />
              11010110
            </motion.div>
          </div>
          <div className="absolute right-1/4 top-2/3 font-mono text-xs text-purple-500/20 dark:text-purple-400/20">
            <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            >
              01010111
              <br />
              10101100
              <br />
              01011011
            </motion.div>
          </div>
        </div>

        {/* Halo effect behind card */}
        <div className="pointer-events-none absolute z-0">
          <motion.div
              className="size-96 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl dark:from-blue-400/10 dark:to-purple-400/10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
          />
        </div>

        <div className="z-10 w-full max-w-md">
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-6 text-center"
          >
            <div className="mb-1 flex items-center justify-center">
              <LucideSparkles className="mr-1 size-5 text-blue-600 dark:text-blue-400" />
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
                TechVerse
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Welcome back to our universe of technology
            </p>
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-gray-200/50 bg-white/90 shadow-xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/90">
              {renderContent()}
            </Card>
          </motion.div>
        </div>

        {/* Include the ResetPasswordModal component */}
        <ResetPasswordModal
            open={resetPasswordOpen}
            onOpenChange={setResetPasswordOpen}
        />
      </div>
  );
}