import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from 'js-cookie';

// Define types
export interface AdminUser {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    role: string;
    statut?: string;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
    lastLogin?: string;
}

export interface AdminProfile {
    adminId?: string;
    notifications?: number;
    pendingMessages?: number;
    lastLogin?: string;
    createdAt?: string;
}

export interface AdminAuthState {
    token: string | null;
    admin: AdminUser | null;
    profile: AdminProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    requireTwoFactor: boolean;
    twoFactorEmail: string | null;

    // Main functions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchAdminProfile: () => Promise<void>;
    updateProfile: (profileData: Partial<AdminUser>) => Promise<boolean>;
    clearError: () => void;

    // 2FA related functions
    verifyTwoFactorToken: (email: string, token: string, isBackupCode?: boolean) => Promise<void>;
    setupTwoFactor: () => Promise<{ secret: string; qrCodeUrl: string }>;
    enableTwoFactor: (token: string) => Promise<boolean>;
    disableTwoFactor: (token: string) => Promise<boolean>;
    generateBackupCodes: () => Promise<string[]>;
    clearTwoFactorState: () => void;

    // Password management
    changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
        Promise<{success: boolean, error?: string}>;

    // Admin-specific functions
    refreshToken: () => Promise<void>;
    checkSession: () => Promise<boolean>;
}

// Create the admin auth store
export const useAdminAuthStore = create<AdminAuthState>()(
    persist(
        (set, get) => ({
            token: null,
            admin: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requireTwoFactor: false,
            twoFactorEmail: null,

            // Login function
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`, {
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

                    const { token, admin } = response.data;

                    // Ensure cookie is set correctly
                    Cookies.set('admin-auth-token', token, {
                        expires: 7,
                        secure: true,
                        sameSite: 'strict',
                        path: '/' // Add this to ensure cookie is available for all paths
                    });

                    // Set authorization header for current session
                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                    set({
                        token,
                        admin,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    get().fetchAdminProfile();
                } catch (err: any) {
                    // Special handling for unverified emails
                    if (err.response?.data?.error === "Votre email n'est pas vérifié" ||
                        err.response?.data?.emailVerified === false) {
                        set({
                            error: "Votre email n'est pas vérifié. Veuillez vérifier votre boîte de réception ou demander un nouvel email de vérification.",
                            isLoading: false,
                        });
                    } else {
                        set({
                            error: err.response?.data?.error || "Erreur de connexion",
                            isLoading: false,
                        });
                    }
                }
            },

            // Verify 2FA token during login for admin
            verifyTwoFactorToken: async (email: string, token: string, isBackupCode = false) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/verify-login`, {
                        email,
                        token,
                        isBackupCode,
                        isAdmin: true // Add flag to identify admin authentication
                    });

                    const { token: jwtToken, admin } = response.data;

                    // Set cookie (expires in 7 days)
                    Cookies.set('admin-auth-token', jwtToken, { expires: 7, secure: true, sameSite: 'strict' });

                    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

                    set({
                        token: jwtToken,
                        admin,
                        isAuthenticated: true,
                        isLoading: false,
                        requireTwoFactor: false,
                        twoFactorEmail: null
                    });

                    get().fetchAdminProfile();
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Code de vérification invalide",
                        isLoading: false,
                    });
                }
            },

            // Logout function
            logout: () => {
                delete axios.defaults.headers.common["Authorization"];
                Cookies.remove('admin-auth-token'); // remove cookie
                set({
                    token: null,
                    admin: null,
                    profile: null,
                    isAuthenticated: false,
                    requireTwoFactor: false,
                    twoFactorEmail: null,
                });
            },

            // Fetch admin profile
            // Updated fetchAdminProfile function for the admin store
            fetchAdminProfile: async () => {
                if (!get().token) return;

                set({ isLoading: true });
                try {
                    // Fetch admin profile data
                    const profileResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admins/me`);

                    const profileData = profileResponse.data;
                    const userInfo = profileData.informationsPersonnelles;

                    // Get unread notifications count
                    /*const notificationsResponse = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/unread-count`
                    );

                    // Get unread messages count
                    const messagesResponse = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/unread-count`
                    );*/

                    // Fetch 2FA status
                    let twoFactorEnabled = false;
                    try {
                        const twoFactorResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/status`);
                        twoFactorEnabled = twoFactorResponse.data.twoFactorEnabled;
                    } catch (e) {
                        // If 2FA status endpoint fails, we'll default to false
                        console.error('Error fetching 2FA status:', e);
                    }

                    const adminUser: AdminUser = {
                        id: userInfo.id,
                        nom: userInfo.nom,
                        prenom: userInfo.prenom,
                        email: userInfo.email,
                        telephone: userInfo.telephone,
                        role: userInfo.role,
                        statut: userInfo.statutCompte,
                        emailVerified: userInfo.emailVerifie,
                        twoFactorEnabled: twoFactorEnabled
                    };

                    const adminProfile: AdminProfile = {
                        adminId: profileData.adminId,
                        // notifications: notificationsResponse.data.count || 0,
                        // pendingMessages: messagesResponse.data.count || 0,
                        lastLogin: userInfo.lastLogin,
                        createdAt: userInfo.dateInscription
                    };

                    set({
                        admin: adminUser,
                        profile: adminProfile,
                        isLoading: false,
                    });
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Une erreur est survenue lors de la récupération du profil admin",
                        isLoading: false,
                    });

                    // If unauthorized, logout
                    if (err.response?.status === 401) {
                        get().logout();
                    }
                }
            },

            // Update profile
            updateProfile: async (profileData: Partial<AdminUser>): Promise<boolean> => {
                if (!get().token) return false;

                set({ isLoading: true });
                try {
                    await axios.put(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/admins/me`,
                        profileData
                    );

                    // Update the local state with the new profile data
                    set(state => ({
                        admin: state.admin ? { ...state.admin, ...profileData } : null,
                        isLoading: false
                    }));

                    return true;
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Erreur lors de la mise à jour du profil",
                        isLoading: false
                    });
                    return false;
                }
            },

            // Change password function
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

            // Setup two-factor authentication
            setupTwoFactor: async (): Promise<{ secret: string; qrCodeUrl: string }> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/setup`);
                    set({ isLoading: false });
                    return {
                        secret: response.data.secret,
                        qrCodeUrl: response.data.qrCodeUrl
                    };
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Erreur lors de la configuration de l'authentification à deux facteurs",
                        isLoading: false
                    });
                    throw err;
                }
            },

            // Enable two-factor authentication
            enableTwoFactor: async (token: string): Promise<boolean> => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/enable`, { token });

                    // Update the admin state with the new 2FA status
                    set(state => ({
                        admin: state.admin ? { ...state.admin, twoFactorEnabled: true } : null,
                        isLoading: false
                    }));

                    return true;
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Code de vérification invalide",
                        isLoading: false
                    });
                    return false;
                }
            },

            // Disable two-factor authentication
            disableTwoFactor: async (token: string): Promise<boolean> => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/disable`, { token });

                    // Update the admin state with the new 2FA status
                    set(state => ({
                        admin: state.admin ? { ...state.admin, twoFactorEnabled: false } : null,
                        isLoading: false
                    }));

                    return true;
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Code de vérification invalide",
                        isLoading: false
                    });
                    return false;
                }
            },

            // Generate backup codes
            generateBackupCodes: async (): Promise<string[]> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/backup-codes`);
                    set({ isLoading: false });
                    return response.data.backupCodes;
                } catch (err: any) {
                    set({
                        error: err.response?.data?.error || "Erreur lors de la génération des codes de secours",
                        isLoading: false
                    });
                    throw err;
                }
            },

            // Clear error state
            clearError: () => set({ error: null }),

            // Clear 2FA state
            clearTwoFactorState: () => set({
                requireTwoFactor: false,
                twoFactorEmail: null,
            }),

            // Refresh token function
            refreshToken: async () => {
                const token = get().token || Cookies.get('admin-auth-token');
                if (!token) return;

                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const newToken = response.data.token;

                    // Update cookie and headers
                    Cookies.set('admin-auth-token', newToken, { expires: 7, secure: true, sameSite: 'strict' });
                    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

                    set({ token: newToken });
                } catch (err) {
                    console.error('Token refresh failed:', err);
                    // If refresh fails, logout
                    get().logout();
                }
            },

            // Check if the session is still valid
            checkSession: async (): Promise<boolean> => {
                const token = get().token || Cookies.get('admin-auth-token');
                if (!token) return false;

                try {
                    // Try to access a protected endpoint that requires authentication
                    await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/admins/me/session-check`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    // If no error occurred, session is valid
                    return true;
                } catch (err: any) {
                    // If 401/403 error, session is invalid
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        get().logout();
                        return false;
                    }

                    // For other errors, assume session is still valid
                    return true;
                }
            }
        }),
        {
            name: "admin-auth-storage", // Storage key for localStorage
            partialize: (state) => ({
                token: state.token,
                admin: state.admin,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);



// Setup axios interceptor for authentication on the admin instance
axios.interceptors.request.use(
    (config) => {
        // Try to get token from cookie first
        let token = Cookies.get('admin-auth-token');

        // If no cookie token, try local storage
        if (!token) {
            const storedState = localStorage.getItem('admin-auth-storage');
            if (storedState) {
                try {
                    const parsedState = JSON.parse(storedState);
                    token = parsedState.state.token;

                    // Optionally, restore the cookie from local storage
                    if (token) {
                        Cookies.set('admin-auth-token', token, {
                            expires: 7,
                            secure: true,
                            sameSite: 'strict',
                            path: '/'
                        });
                    }
                } catch (e) {
                    console.error('Error parsing auth storage', e);
                }
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle 401/403 errors automatically for admin
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Check if the error is from a login attempt
            const isLoginRequest = error.config.url.includes('/login');

            if (!isLoginRequest) {
                // If not a login request, clear the auth state
                const store = useAdminAuthStore.getState();
                store.logout();
            }
        }
        return Promise.reject(error);
    }
);