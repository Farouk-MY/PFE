import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from 'js-cookie';

// Define types
export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    soldePoints: number;
    ville?: string;
    codePostal?: string;
    gouvernorat?: string;
    ordersCount?: number;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
}

export interface VerificationResult {
    success: boolean;
    redirectUrl?: string;
    error?: string;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    verificationEmailSent: boolean;
    verificationEmail: string | null;
    passwordResetSent: boolean;
    passwordResetEmail: string | null;
    requireTwoFactor: boolean;
    twoFactorEmail: string | null;
    qrCodeUrl: string | null;
    backupCodes: string[] | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (userData: SignupData) => Promise<void>;
    logout: () => void;
    fetchUserProfile: () => Promise<void>;
    clearError: () => void;
    resendVerificationEmail: (email: string) => Promise<{success: boolean, error?: string}>;
    checkEmailAvailability: (email: string) => Promise<boolean>;
    clearVerificationState: () => void;
    verifyEmail: (token: string) => Promise<VerificationResult>;
    resetPassword: (email: string) => Promise<{success: boolean, error?: string}>;
    verifyResetToken: (token: string, newPassword: string) => Promise<{success: boolean, error?: string}>;
    updateProfile: (userData: UpdateProfileData) => Promise<{success: boolean, error?: string}>;
    clearPasswordResetState: () => void;
    changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
        Promise<{success: boolean, error?: string}>;
    // 2FA methods
    setupTwoFactor: () => Promise<{success: boolean, qrCode?: string, secret?: string, error?: string}>;
    verifyAndEnableTwoFactor: (token: string) => Promise<{success: boolean, backupCodes?: string[], error?: string}>;
    disableTwoFactor: (currentPassword: string) => Promise<{success: boolean, error?: string}>;
    verifyTwoFactorToken: (email: string, token: string, isBackupCode?: boolean) => Promise<void>;
    getTwoFactorStatus: () => Promise<{enabled: boolean, error?: string}>;
    generateNewBackupCodes: (currentPassword: string) => Promise<{success: boolean, backupCodes?: string[], error?: string}>;
    clearTwoFactorState: () => void;
}

export interface SignupData {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    ville?: string;
    codePostal?: string;
    gouvernorat?: string;
    motDePasse: string;
}

export interface UpdateProfileData {
    nom?: string;
    prenom?: string;
    telephone?: string;
    ville?: string;
    codePostal?: string;
    gouvernorat?: string;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            verificationEmailSent: false,
            verificationEmail: null,
            passwordResetSent: false,
            passwordResetEmail: null,
            requireTwoFactor: false,
            twoFactorEmail: null,
            qrCodeUrl: null,
            backupCodes: null,

            // Login function
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                        email,
                        motDePasse: password,
                    });

                    // Check if 2FA is required
                    if (response.data.requireTwoFactor) {
                        set({
                            isLoading: false,
                            requireTwoFactor: true,
                            twoFactorEmail: email,
                        });
                        return;
                    }

                    const { token, client } = response.data;

                    // Set cookie (expires in 7 days)
                    Cookies.set('auth-token', token, { expires: 7, secure: true, sameSite: 'strict' });

                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                    set({
                        token,
                        user: client,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    get().fetchUserProfile();
                } catch (err: any) {
                    // Special handling for unverified emails
                    if (err.response?.data?.error === "Votre email n'est pas vérifié" ||
                        err.response?.data?.emailVerified === false) {
                        set({
                            error: "Votre email n'est pas vérifié. Veuillez vérifier votre boîte de réception ou demander un nouvel email de vérification.",
                            isLoading: false,
                            verificationEmail: email
                        });
                    }
                    // Add special handling for blocked accounts
                    else if (err.response?.data?.error.includes('compte a été bloqué')) {
                        set({
                            error: "Votre compte a été bloqué. Veuillez contacter l'administrateur pour plus d'informations.",
                            isLoading: false,
                        });
                    }
                    else {
                        set({
                            error: err.response?.data?.error || "Erreur de connexion",
                            isLoading: false,
                        });
                    }
                }
            },

            // Verify 2FA token during login
            verifyTwoFactorToken: async (email: string, token: string, isBackupCode = false) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/verify-login`, {
                        email,
                        token,
                        isBackupCode
                    });

                    const { token: jwtToken, client } = response.data;

                    // Set cookie (expires in 7 days)
                    Cookies.set('auth-token', jwtToken, { expires: 7, secure: true, sameSite: 'strict' });

                    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

                    set({
                        token: jwtToken,
                        user: client,
                        isAuthenticated: true,
                        isLoading: false,
                        requireTwoFactor: false,
                        twoFactorEmail: null
                    });

                    get().fetchUserProfile();
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Code de vérification invalide",
                        isLoading: false,
                    });
                }
            },

            // Setup 2FA
            setupTwoFactor: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/setup`);

                    set({
                        qrCodeUrl: response.data.qrCode,
                        isLoading: false
                    });

                    return {
                        success: true,
                        qrCode: response.data.qrCode,
                        secret: response.data.secret
                    };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la configuration de l'authentification à deux facteurs";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Verify and enable 2FA
            verifyAndEnableTwoFactor: async (token: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/verify`, {
                        token
                    });

                    // Update user object with 2FA enabled
                    set(state => ({
                        user: state.user ? { ...state.user, twoFactorEnabled: true } : null,
                        backupCodes: response.data.backupCodes,
                        isLoading: false
                    }));

                    return {
                        success: true,
                        backupCodes: response.data.backupCodes
                    };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Code de vérification invalide";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Disable 2FA
            disableTwoFactor: async (currentPassword: string) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/disable`, {
                        currentPassword
                    });

                    // Update user object with 2FA disabled
                    set(state => ({
                        user: state.user ? { ...state.user, twoFactorEnabled: false } : null,
                        isLoading: false
                    }));

                    return { success: true };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la désactivation de l'authentification à deux facteurs";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Get 2FA status
            getTwoFactorStatus: async () => {
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/status`);

                    // Update user object with 2FA status
                    set(state => ({
                        user: state.user
                            ? { ...state.user, twoFactorEnabled: response.data.twoFactorEnabled }
                            : null
                    }));

                    return { enabled: response.data.twoFactorEnabled };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la récupération du statut de l'authentification à deux facteurs";
                    return {
                        enabled: false,
                        error: errorMsg
                    };
                }
            },

            // Generate new backup codes
            generateNewBackupCodes: async (currentPassword: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/backup-codes`, {
                        currentPassword
                    });

                    set({
                        backupCodes: response.data.backupCodes,
                        isLoading: false
                    });

                    return {
                        success: true,
                        backupCodes: response.data.backupCodes
                    };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la génération des codes de secours";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Clear 2FA state
            clearTwoFactorState: () => set({
                requireTwoFactor: false,
                twoFactorEmail: null,
                qrCodeUrl: null,
                backupCodes: null
            }),

            // Signup function
            signup: async (userData: SignupData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, userData);

                    // Check if verification email was sent
                    if (response.data.verificationSent) {
                        set({
                            isLoading: false,
                            verificationEmailSent: true,
                            verificationEmail: userData.email
                        });
                    } else {
                        set({ isLoading: false });
                        // Login automatically if no verification needed
                        await get().login(userData.email, userData.motDePasse);
                    }
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Une erreur est survenue lors de l'inscription",
                        isLoading: false,
                    });
                }
            },

            // Logout function
            logout: () => {
                delete axios.defaults.headers.common["Authorization"];
                Cookies.remove('auth-token'); // remove cookie
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    requireTwoFactor: false,
                    twoFactorEmail: null,
                });
            },

            // Fetch user profile (for refreshing user data)
            fetchUserProfile: async () => {
                if (!get().token) return;

                set({ isLoading: true });
                try {
                    // Fetch user profile data
                    const profileResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/me`);

                    // Fetch 2FA status
                    let twoFactorEnabled = false;
                    try {
                        const twoFactorResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/status`);
                        twoFactorEnabled = twoFactorResponse.data.twoFactorEnabled;
                    } catch (e) {
                        // If 2FA status endpoint fails, we'll default to false
                        console.error('Error fetching 2FA status:', e);
                    }

                    // Fetch orders count (if your API supports this)
                    let ordersCount = 0;
                    try {
                        const ordersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/count`);
                        ordersCount = ordersResponse.data.count || 0;
                    } catch (e) {
                        // If orders count endpoint doesn't exist, we can get it from profile
                        ordersCount = profileResponse.data.statistiques?.totalCommandes || 0;
                    }

                    set({
                        user: {
                            id: profileResponse.data.informationsPersonnelles.id,
                            nom: profileResponse.data.informationsPersonnelles.nom,
                            prenom: profileResponse.data.informationsPersonnelles.prenom,
                            email: profileResponse.data.informationsPersonnelles.email,
                            telephone: profileResponse.data.informationsPersonnelles.telephone,
                            ville: profileResponse.data.informationsPersonnelles.adresse?.ville,
                            codePostal: profileResponse.data.informationsPersonnelles.adresse?.codePostal,
                            gouvernorat: profileResponse.data.informationsPersonnelles.adresse?.gouvernorat,
                            soldePoints: profileResponse.data.points.solde,
                            ordersCount: ordersCount,
                            emailVerified: profileResponse.data.informationsPersonnelles.emailVerifie,
                            twoFactorEnabled: twoFactorEnabled
                        },
                        isLoading: false,
                    });
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Une erreur est survenue lors de la récupération du profil",
                        isLoading: false,
                    });

                    // If unauthorized, logout
                    if (err.response?.status === 401) {
                        get().logout();
                    }
                }
            },

            changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string):
                Promise<{success: boolean, error?: string}> => {
                // Check if passwords match
                if (newPassword !== confirmPassword) {
                    return { success: false, error: "Les mots de passe ne correspondent pas" };
                }

                // Check password strength (minimum 8 characters)
                if (newPassword.length < 8) {
                    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères" };
                }

                set({ isLoading: true, error: null });
                try {
                    await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
                        { currentPassword, newPassword }
                    );

                    set({ isLoading: false });
                    return { success: true };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors du changement de mot de passe";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Verify Email with token
            verifyEmail: async (token: string): Promise<VerificationResult> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
                        params: { token: encodeURIComponent(token) }
                    });

                    set({ isLoading: false });

                    if (response.data.success) {
                        // If user exists in the store, update emailVerified
                        if (get().user) {
                            set(state => ({
                                user: state.user ? { ...state.user, emailVerified: true } : null
                            }));
                        }
                        return {
                            success: true,
                            redirectUrl: response.data.redirectUrl || '/auth/signin?verified=true'
                        };
                    } else {
                        return {
                            success: false,
                            error: response.data.error || 'Échec de la vérification'
                        };
                    }
                } catch (err: any) {
                    set({ isLoading: false });
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Erreur lors de la vérification'
                    };
                }
            },

            // Resend verification email
            resendVerificationEmail: async (email: string): Promise<{success: boolean, error?: string}> => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, { email });
                    set({
                        isLoading: false,
                        verificationEmailSent: true,
                        verificationEmail: email
                    });
                    return { success: true };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de l'envoi de l'email de vérification";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Check if email is available
            checkEmailAvailability: async (email: string): Promise<boolean> => {
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-email`, {
                        params: { email }
                    });
                    return response.data.available;
                } catch (err) {
                    return false;
                }
            },

            // Reset password (request reset email)
            resetPassword: async (email: string): Promise<{success: boolean, error?: string}> => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, { email });
                    set({
                        isLoading: false,
                        passwordResetSent: true,
                        passwordResetEmail: email
                    });
                    return { success: true };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la demande de réinitialisation du mot de passe";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Verify reset token and set new password
            verifyResetToken: async (token: string, newPassword: string): Promise<{success: boolean, error?: string}> => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-reset-token`, {
                        token,
                        newPassword
                    });
                    set({ isLoading: false });
                    return { success: true };
                } catch (err: any) {
                    const errorMsg = err.response?.data?.error || "Erreur lors de la réinitialisation du mot de passe";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Update user profile
            updateProfile: async (userData: UpdateProfileData): Promise<{success: boolean, error?: string}> => {
                set({ isLoading: true, error: null });
                try {
                    // Ensure we have authorization headers set
                    const token = get().token;
                    const config = {
                        headers: { Authorization: `Bearer ${token}` }
                    };

                    const response = await axios.put(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/update`,
                        userData,
                        config
                    );

                    if (response.data.user) {
                        set(state => ({
                            user: state.user ? { ...state.user, ...userData } : null,
                            isLoading: false
                        }));
                    }

                    return { success: true };
                } catch (err: any) {
                    console.error('Profile update error:', err.response || err);
                    const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour du profil";
                    set({
                        error: errorMsg,
                        isLoading: false
                    });
                    return { success: false, error: errorMsg };
                }
            },

            // Clear error state
            clearError: () => set({ error: null }),

            // Clear verification state (after user has seen confirmation)
            clearVerificationState: () => set({
                verificationEmailSent: false,
                verificationEmail: null
            }),

            // Clear password reset state
            clearPasswordResetState: () => set({
                passwordResetSent: false,
                passwordResetEmail: null
            }),
        }),
        {
            name: "auth-storage", // Storage key for localStorage
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Create a dedicated axios instance for client operations
export const clientAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Setup axios interceptor for token handling on the client instance
axios.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 responses globally for client
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);