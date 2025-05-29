"use client"

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { Shield, Key, Smartphone, Mail, AlertTriangle, Check, X, Copy, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function SecurityPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['security', 'common'])
    const { language } = useLanguage()
    
    const {
        user,
        changePassword,
        setupTwoFactor,
        verifyAndEnableTwoFactor,
        disableTwoFactor,
        getTwoFactorStatus,
        generateNewBackupCodes,
        qrCodeUrl,
        backupCodes
    } = useAuthStore()
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showSetupTwoFactor, setShowSetupTwoFactor] = useState(false)
    const [showBackupCodes, setShowBackupCodes] = useState(false)
    const [showDisableTwoFactor, setShowDisableTwoFactor] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [passwordError, setPasswordError] = useState("")
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [twoFactorCode, setTwoFactorCode] = useState("")
    const [disablePassword, setDisablePassword] = useState("")
    const [currentBackupCodes, setCurrentBackupCodes] = useState<string[]>([])
    const [codesCopied, setCodesCopied] = useState(false)
    const [securityStatus, setSecurityStatus] = useState({
        passwordStrength: "unknown",
        twoFactorEnabled: false,
        emailVerified: false,
        lastPasswordChange: null as string | null
    });
    const { toast } = useToast()

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    // Update security status when user data changes
    useEffect(() => {
        if (user) {
            // Calculate password strength (this would typically come from your backend)
            // For now we'll set a placeholder value
            const passwordStrength = "strong"; // In a real app, you'd get this from the backend

            setSecurityStatus({
                passwordStrength,
                twoFactorEnabled: user.twoFactorEnabled || false,
                emailVerified: user.emailVerified || false,
                lastPasswordChange: "3 months ago" // This would ideally come from your backend
            });

            setTwoFactorEnabled(user.twoFactorEnabled || false);
        }

        // Fetch 2FA status on mount
        fetchTwoFactorStatus();
    }, [user]);

    // Reset the 2FA code when the setup dialog is closed
    useEffect(() => {
        if (!showSetupTwoFactor) {
            setTwoFactorCode("");
        }
    }, [showSetupTwoFactor]);

    // Update backup codes state when they change in the store
    useEffect(() => {
        if (backupCodes) {
            setCurrentBackupCodes(backupCodes);
            if (!showBackupCodes) {
                setShowBackupCodes(true);
            }
        }
    }, [backupCodes]);

    const fetchTwoFactorStatus = async () => {
        const result = await getTwoFactorStatus();
        setTwoFactorEnabled(result.enabled);
    };

    const toggleTwoFactor = async () => {
        if (twoFactorEnabled) {
            // If already enabled, show disable dialog
            setShowDisableTwoFactor(true);
        } else {
            // If disabled, show setup dialog
            const result = await setupTwoFactor();
            if (result.success && result.qrCode) {
                setShowSetupTwoFactor(true);
            } else {
                toast({
                    title: "Setup Failed",
                    description: result.error || "Failed to set up two-factor authentication",
                    variant: "destructive",
                });
            }
        }
    };

    const handleVerifyAndEnable = async () => {
        if (!twoFactorCode || twoFactorCode.length < 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid verification code",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const result = await verifyAndEnableTwoFactor(twoFactorCode);
        setIsSubmitting(false);

        if (result.success) {
            setTwoFactorEnabled(true);
            setShowSetupTwoFactor(false);

            // Show backup codes
            if (result.backupCodes) {
                setCurrentBackupCodes(result.backupCodes);
                setShowBackupCodes(true);
            }

            toast({
                title: "Two-factor authentication enabled",
                description: "Your account is now more secure.",
                variant: "default",
            });

            // Update security status
            setSecurityStatus(prev => ({
                ...prev,
                twoFactorEnabled: true
            }));
        } else {
            toast({
                title: "Verification Failed",
                description: result.error || "Invalid verification code",
                variant: "destructive",
            });
        }
    };

    const handleDisableTwoFactor = async () => {
        if (!disablePassword) {
            toast({
                title: "Password Required",
                description: "Please enter your password to disable 2FA",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const result = await disableTwoFactor(disablePassword);
        setIsSubmitting(false);

        if (result.success) {
            setTwoFactorEnabled(false);
            setShowDisableTwoFactor(false);
            setDisablePassword("");

            toast({
                title: "Two-factor authentication disabled",
                description: "Your account is now less secure. We recommend enabling 2FA.",
                variant: "destructive",
            });

            // Update security status
            setSecurityStatus(prev => ({
                ...prev,
                twoFactorEnabled: false
            }));
        } else {
            toast({
                title: "Disable Failed",
                description: result.error || "Could not disable two-factor authentication",
                variant: "destructive",
            });
        }
    };

    const handleGenerateNewBackupCodes = async () => {
        const result = await generateNewBackupCodes(disablePassword);

        if (result.success && result.backupCodes) {
            setCurrentBackupCodes(result.backupCodes);
            setCodesCopied(false);

            toast({
                title: "New Backup Codes Generated",
                description: "Your old backup codes are now invalid. Make sure to save these new codes.",
                variant: "default",
            });
        } else {
            toast({
                title: "Generation Failed",
                description: result.error || "Could not generate new backup codes",
                variant: "destructive",
            });
        }
    };

    const copyBackupCodes = () => {
        if (currentBackupCodes.length > 0) {
            navigator.clipboard.writeText(currentBackupCodes.join('\n'));
            setCodesCopied(true);
            toast({
                title: "Backup Codes Copied",
                description: "Your backup codes have been copied to clipboard",
                variant: "default",
            });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        setPasswordError("")

        // Validate all fields are filled
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError(t('allFields'))
            return
        }

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError(t('passwordsDoNotMatch'))
            return
        }

        // Validate password strength
        if (passwordData.newPassword.length < 8) {
            setPasswordError(t('passwordTooShort'))
            return
        }

        setIsSubmitting(true);
        try {
            const result = await changePassword(
                passwordData.currentPassword,
                passwordData.newPassword,
                passwordData.confirmPassword
            );

            setIsSubmitting(false);

            if (result.success) {
                toast({
                    title: t('changePassword'),
                    description: t('auth:resetPassword.passwordUpdated'),
                });
                setShowChangePassword(false);

                // Update the security status to reflect recent password change
                setSecurityStatus(prev => ({
                    ...prev,
                    lastPasswordChange: t('justNow', { ns: 'common' })
                }));

                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setPasswordError(result.error || t('errorOccurred'))
            }
        } catch (error) {
            setIsSubmitting(false);
            setPasswordError(t('passwordChangeError'))
        }
    };

    // Get security score based on enabled security features
    const getSecurityScore = () => {
        let score = 0;
        if (securityStatus.passwordStrength === "strong") score += 40;
        if (securityStatus.twoFactorEnabled) score += 40;
        if (securityStatus.emailVerified) score += 20;
        return score;
    }

    const securityScore = getSecurityScore();
    const securityLevel =
        securityScore >= 80 ? "High" :
            securityScore >= 60 ? "Good" :
                securityScore >= 40 ? "Moderate" : "Low";

    const securityColor =
        securityScore >= 80 ? "bg-green-500" :
            securityScore >= 60 ? "bg-blue-500" :
                securityScore >= 40 ? "bg-yellow-500" : "bg-red-500";

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <ProfileSidebar />

                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold">{t('title')}</h1>
                            <p className="text-muted-foreground mt-1">
                                {t('subtitle')}
                            </p>
                        </div>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-6">{t('passwordAuth')}</h2>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Key className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{t('password')}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t('lastChanged', { time: securityStatus.lastPasswordChange })}
                                            </p>
                                        </div>
                                    </div>
                                    <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                                        <DialogTrigger asChild>
                                            <Button>{t('changePassword')}</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{t('changePasswordTitle')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('changePasswordDescription')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                                                {passwordError && (
                                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                                        {passwordError}
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                                                    <Input
                                                        id="currentPassword"
                                                        type="password"
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">{t('newPassword')}</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    />
                                                </div>
                                                <div className="pt-4">
                                                    <Button
                                                        type="submit"
                                                        className="w-full"
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? t('updating') : t('updatePassword')}
                                                    </Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Smartphone className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{t('twoFactor')}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {twoFactorEnabled
                                                    ? t('twoFactorEnabled')
                                                    : t('twoFactorDisabled')}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={twoFactorEnabled}
                                        onCheckedChange={toggleTwoFactor}
                                    />
                                </div>

                                {/* Setup 2FA Dialog */}
                <Dialog open={showSetupTwoFactor} onOpenChange={setShowSetupTwoFactor}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('setupTwoFactor')}</DialogTitle>
                            <DialogDescription>
                                {t('setupTwoFactorDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {qrCodeUrl && (
                                <div className="flex justify-center">
                                    <div className="p-2 bg-white rounded-lg">
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Code for 2FA"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="text-sm text-center text-muted-foreground">
                                {t('scanQrCodeInstructions')}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verificationCode">{t('verificationCode')}</Label>
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    placeholder={t('verificationCodePlaceholder')}
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowSetupTwoFactor(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleVerifyAndEnable}
                                disabled={isSubmitting || !twoFactorCode || twoFactorCode.length < 6}
                            >
                                {isSubmitting ? t('verifying') : t('verifyAndEnable')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Backup Codes Dialog */}
                <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('backupCodes')}</DialogTitle>
                            <DialogDescription>
                                {t('backupCodesDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                                {currentBackupCodes.map((code, index) => (
                                    <div key={index} className="py-1">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={copyBackupCodes}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    {codesCopied ? t('copied') : t('copyToClipboard')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleGenerateNewBackupCodes}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {t('generateNewCodes')}
                                </Button>
                            </div>
                            <div className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>{t('backupCodesWarning')}</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => setShowBackupCodes(false)}
                            >
                                {t('savedCodes')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Disable 2FA Dialog */}
                <Dialog open={showDisableTwoFactor} onOpenChange={setShowDisableTwoFactor}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('disableTwoFactor')}</DialogTitle>
                            <DialogDescription>
                                {t('disableTwoFactorDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 mt-0.5" />
                                <div>
                                    <p className="font-medium">{t('securityWarning')}</p>
                                    <p className="text-sm mt-1">{t('securityWarningDescription')}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="disablePassword">{t('confirmPassword')}</Label>
                                <Input
                                    id="disablePassword"
                                    type="password"
                                    placeholder={t('currentPasswordPlaceholder')}
                                    value={disablePassword}
                                    onChange={(e) => setDisablePassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDisableTwoFactor(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDisableTwoFactor}
                                disabled={isSubmitting || !disablePassword}
                            >
                                {isSubmitting ? t('disabling') : t('confirmDisable')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Mail className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Recovery Email</p>
                                            <p className="text-sm text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline">Update</Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">{t('securityStatus')}</h2>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">
                                        {securityLevel === "High" ? t('highSecurity') : 
                                         securityLevel === "Good" ? t('goodSecurity') : 
                                         securityLevel === "Moderate" ? t('moderateSecurity') : t('lowSecurity')}
                                    </div>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${securityColor}`} style={{ width: `${securityScore}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {securityStatus.passwordStrength === "strong" ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span>{t('strongPassword')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-500">
                                        <X className="h-5 w-5" />
                                        <span>{t('weakPassword')}</span>
                                    </div>
                                )}

                                {securityStatus.twoFactorEnabled ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span>{t('twoFactorEnabled')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-500">
                                        <X className="h-5 w-5" />
                                        <span>{t('twoFactorDisabled')}</span>
                                    </div>
                                )}

                                {securityStatus.emailVerified ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span>{t('emailVerified')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-500">
                                        <X className="h-5 w-5" />
                                        <span>{t('emailNotVerified')}</span>
                                    </div>
                                )}
                            </div>

                            {securityScore < 80 && (
                                <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800 dark:text-amber-400">
                                                {t('securityRecommendation')}
                                            </p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                {!securityStatus.twoFactorEnabled && t('enableTwoFactorRecommendation')}
                                                {!securityStatus.emailVerified && !securityStatus.twoFactorEnabled && ` ${t('and')} `}
                                                {!securityStatus.emailVerified && t('verifyEmailRecommendation')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t('accountProtection')}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('accountProtectionDescription')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 mt-1 text-green-500" />
                                    <p>{t('dataEncryption')}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 mt-1 text-green-500" />
                                    <p>{t('regularAudits')}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 mt-1 text-green-500" />
                                    <p>{t('accountLockout')}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}