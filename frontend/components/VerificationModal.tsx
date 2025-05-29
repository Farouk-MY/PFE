// components/VerificationModal.tsx
"use client";

import React from "react";
import { Mail, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export default function VerificationModal({
                                              isOpen,
                                              onClose,
                                              email,
                                          }: VerificationModalProps) {
    const router = useRouter();
    const resendVerificationEmail = useAuthStore(
        (state) => state.resendVerificationEmail
    );

    const handleResend = async () => {
        if (!email) {
            toast.error("Adresse email manquante");
            return;
        }

        try {
            const result = await resendVerificationEmail(email);

            if (result.success) {
                toast.success("Email de vérification renvoyé avec succès!");
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Erreur lors de l'envoi"
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-0 p-6 text-center space-y-4">
                <DialogHeader>
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                        <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <DialogTitle className="text-xl text-center">Vérifiez votre email</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Nous avons envoyé un lien de vérification à{" "}
                        <span className="font-semibold">{email}</span>. Veuillez vérifier
                        votre boîte de réception.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                    <Button
                        onClick={handleResend}
                        variant="outline"
                        className="w-full"
                    >
                        Renvoyer l'email de vérification
                    </Button>

                    <Button
                        onClick={() => router.push("/auth/signin")}
                        className="w-full"
                    >
                        Aller à la page de connexion
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}