import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './auth';
import { useCartStore } from './cartStore';

// Constants for points calculation
const POINTS_FOR_DISCOUNT = 2000; // Points needed for each 10% discount
const DISCOUNT_PERCENTAGE_PER_POINTS = 10; // 10% discount for each 2000 points

interface CommandeState {
    isLoading: boolean;
    error: string | null;
    currentCommande: any | null;
    commandeHistory: any[];
    pointsUsed: number;
    discountApplied: number;
    deliveryOption: 'pickup' | 'delivery';
    deliveryAddress: string | null;

    // Actions
    createCommande: (usePoints: boolean, pointsToUse: number, paymentMethod: 'espece', deliveryOption: 'pickup' | 'delivery', deliveryAddress?: string) => Promise<any>;
    getCommandeDetails: (commandeId: number) => Promise<any>;
    getCommandeHistory: () => Promise<any[]>;
    confirmDelivery: (commandeId: number, montant: number) => Promise<boolean>;
    downloadInvoice: (commandeId: number) => Promise<Blob>;
    resetCommandeState: () => void;
    setDeliveryOption: (option: 'pickup' | 'delivery', address?: string) => void;

    // Helper function to calculate discount from points
    calculateDiscountFromPoints: (points: number) => number;
}

export const useCommandeStore = create<CommandeState>((set, get) => ({
    isLoading: false,
    error: null,
    currentCommande: null,
    commandeHistory: [],
    pointsUsed: 0,
    discountApplied: 0,
    deliveryOption: 'pickup',
    deliveryAddress: null,

    // Helper function to calculate discount percentage from points
    calculateDiscountFromPoints: (points: number) => {
        const discountPercentage = Math.floor(points / 2000) * 10;
        return Math.min(discountPercentage, 50);
    },

    createCommande: async (usePoints, pointsToUse, paymentMethod, deliveryOption, deliveryAddress) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated');

            const userId = useAuthStore.getState().user?.id;
            if (!userId) throw new Error('User information not available');

            const cartStore = useCartStore.getState();
            const userIdNum = parseInt(userId.toString(), 10);

            if (isNaN(userIdNum)) {
                throw new Error('Invalid user ID format');
            }

            const panierId = await cartStore.preparePanierForCheckout(userIdNum);

            if (!panierId) {
                throw new Error('Failed to prepare cart for checkout');
            }

            // Enforce 2000 points for a 10% discount
            const pointsToUseAdjusted = usePoints ? Math.min(pointsToUse, 2000) : 0; // Fix: Limit to 2000 points for 10% discount

            const discountPercentage = usePoints ? get().calculateDiscountFromPoints(pointsToUseAdjusted) : 0;

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande`,
                {
                    panier_id: panierId,
                    utiliserPoints: usePoints,
                    pointsToUse: pointsToUseAdjusted, // Use the adjusted points
                    discountPercentage: discountPercentage,
                    paymentMethod: 'espece',
                    livrerDomicile: deliveryOption === 'delivery',
                    adresseLivraison: deliveryAddress
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            cartStore.clearCart();

            set({
                currentCommande: response.data,
                pointsUsed: pointsToUseAdjusted,
                discountApplied: discountPercentage,
                deliveryOption,
                deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : null,
                isLoading: false
            });

            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to create order';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },
    getCommandeDetails: async (commandeId) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande/${commandeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({ currentCommande: response.data, isLoading: false });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to get order details';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    getCommandeHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande/history`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({ commandeHistory: response.data, isLoading: false });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to get order history';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    confirmDelivery: async (commandeId, montant) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated');

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande/${commandeId}/confirm-livraison`,
                { montant, methode: 'espece' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({ isLoading: false });
            return true;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to confirm delivery';
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    downloadInvoice: async (commandeId) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande/${commandeId}/facture`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    responseType: 'blob'
                }
            );

            set({ isLoading: false });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to download invoice';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    resetCommandeState: () => {
        set({
            currentCommande: null,
            pointsUsed: 0,
            discountApplied: 0,
            deliveryOption: 'pickup',
            deliveryAddress: null,
            error: null
        });
    },

    setDeliveryOption: (option, address) => {
        set({
            deliveryOption: option,
            deliveryAddress: option === 'delivery' ? address || null : null
        });
    }
}));