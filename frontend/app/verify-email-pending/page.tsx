"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mail, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'
import { useEffect } from 'react'

export default function VerifyEmailPendingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const resendVerificationEmail = useAuthStore(state => state.resendVerificationEmail);

    // Verify we have an email parameter
    useEffect(() => {
        if (!email) {
            toast.error('Email parameter missing');
            setTimeout(() => router.push('/auth/signin'), 1000);
        }
    }, [email, router]);

    const handleResend = async () => {
        if (!email) {
            toast.error('Adresse email manquante');
            return;
        }

        try {
            const result = await resendVerificationEmail(email);

            if (result.success) {
                toast.success('Email de vérification renvoyé avec succès!');
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
        }
    };

    // If no email, show minimal loading UI during redirect
    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <p>Redirection...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-8 text-center space-y-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-8 w-8 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold">Vérifiez votre email</h2>

                <p className="text-muted-foreground">
                    Nous avons envoyé un lien de vérification à <span className="font-semibold">{email}</span>.
                    Veuillez vérifier votre boîte de réception.
                </p>

                <div className="space-y-3">
                    <Button
                        onClick={handleResend}
                        variant="outline"
                        className="w-full"
                    >
                        Renvoyer l'email de vérification
                    </Button>

                    <Button
                        onClick={() => router.push('/auth/signin')}
                        className="w-full"
                    >
                        Aller à la page de connexion
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}