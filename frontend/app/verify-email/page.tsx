"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store'; // Adjust this import path as needed

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const verifyEmail = useAuthStore(state => state.verifyEmail);

    useEffect(() => {
        if (token) {
            handleVerifyEmail(token);
        } else {
            setStatus('error');
            toast.error('Token de vérification manquant');
            setTimeout(() => router.push('/auth/signin?verified=false'), 2000);
        }
    }, [token, router]);

    const handleVerifyEmail = async (token: string) => {
        setStatus('loading');
        try {
            const result = await verifyEmail(token);

            if (result.success) {
                setStatus('success');
                toast.success('Email vérifié avec succès!');
                setTimeout(() => {
                    // Attempt to close the window
                    window.close();
                    // Fallback redirect in case window.close() fails
                    window.location.href = result.redirectUrl || '/auth/signin?verified=true';
                }, 2000);
            } else {
                throw new Error(result.error || 'Échec de la vérification');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setStatus('error');
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la vérification');
            setTimeout(() => router.push('/auth/signin?verified=false'), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-8 text-center space-y-4">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 mx-auto animate-spin text-blue-600" />
                            <h2 className="text-xl font-semibold">Vérification en cours</h2>
                            <p className="text-muted-foreground">Veuillez patienter pendant que nous vérifions votre email...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold">Email vérifié!</h2>
                            <p className="text-muted-foreground">Votre adresse email a été vérifiée avec succès.</p>
                            <p className="text-sm text-muted-foreground">Cette fenêtre va se fermer automatiquement ou vous serez redirigé...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-xl font-semibold">Échec de la vérification</h2>
                            <p className="text-muted-foreground">Le lien de vérification est invalide ou a expiré.</p>
                            <Button
                                onClick={() => router.push('/auth/signin')}
                                className="mt-4"
                            >
                                Retour à la page de connexion
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}