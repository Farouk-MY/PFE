import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { useAuthStore } from './auth';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    points: number;
}

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    totalPoints: number;
    panier_id: number | null;
    isLoading: boolean;
    error: string | null;

    // Local cart methods
    addItem: (item: CartItem) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalPoints: () => number;

    // Server methods
    createServerPanier: (client_id: number) => Promise<number>;
    addItemToServerPanier: (item: CartItem) => Promise<boolean>;
    syncCartWithServer: () => Promise<boolean>;
    preparePanierForCheckout: (client_id: number) => Promise<number>;
}

// Helper function to calculate cart totals
const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPoints = items.reduce((sum, item) => sum + (item.points * item.quantity), 0);

    return { totalItems, totalPrice, totalPoints };
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,
            totalPoints: 0,
            panier_id: null,
            isLoading: false,
            error: null,

            // Local cart methods
            addItem: (item) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(i => i.id === item.id);

                let updatedItems;

                if (existingItem) {
                    // Update quantity for existing item
                    updatedItems = currentItems.map(i =>
                        i.id === item.id
                            ? { ...i, quantity: i.quantity + item.quantity }
                            : i
                    );
                } else {
                    // Add new item to cart
                    updatedItems = [...currentItems, item];
                }

                const totals = calculateTotals(updatedItems);

                set({
                    items: updatedItems,
                    ...totals
                });
            },

            removeItem: (itemId) => {
                const updatedItems = get().items.filter(item => item.id !== itemId);
                const totals = calculateTotals(updatedItems);

                set({
                    items: updatedItems,
                    ...totals
                });
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    // Remove item if quantity is 0 or negative
                    get().removeItem(itemId);
                    return;
                }

                const updatedItems = get().items.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                );

                const totals = calculateTotals(updatedItems);

                set({
                    items: updatedItems,
                    ...totals
                });
            },

            clearCart: () => {
                set({
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    totalPoints: 0,
                    panier_id: null
                });
            },

            getTotalPrice: () => {
                return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            },

            getTotalPoints: () => {
                return get().items.reduce((sum, item) => sum + (item.points * item.quantity), 0);
            },

            // Server methods
            createServerPanier: async (client_id) => {
                set({ isLoading: true, error: null });
                try {
                    const token = useAuthStore.getState().token;
                    if (!token) throw new Error('Not authenticated');

                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/panier`,
                        { client_id },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    const newPanierId = response.data.data.id;
                    set({
                        panier_id: newPanierId,
                        isLoading: false
                    });
                    return newPanierId;
                } catch (error: any) {
                    const errorMsg = error.response?.data?.error || error.message || 'Failed to create server cart';
                    set({ error: errorMsg, isLoading: false });
                    throw new Error(errorMsg);
                }
            },

            addItemToServerPanier: async (item) => {
                const panierId = get().panier_id;
                if (!panierId) {
                    set({ error: 'No active panier on server' });
                    return false;
                }

                set({ isLoading: true, error: null });
                try {
                    const token = useAuthStore.getState().token;
                    if (!token) throw new Error('Not authenticated');

                    await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/panier/${panierId}/add-product`,
                        {
                            produit_id: parseInt(item.id),
                            qteCmd: item.quantity
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    set({ isLoading: false });
                    return true;
                } catch (error: any) {
                    const errorMsg = error.response?.data?.error || error.message || 'Failed to add product to server cart';
                    set({ error: errorMsg, isLoading: false });
                    return false;
                }
            },

            syncCartWithServer: async () => {
                const items = get().items;
                const panierId = get().panier_id;

                if (!panierId || items.length === 0) {
                    return false;
                }

                set({ isLoading: true, error: null });
                try {
                    // Add each item to the server panier
                    for (const item of items) {
                        await get().addItemToServerPanier(item);
                    }

                    set({ isLoading: false });
                    return true;
                } catch (error: any) {
                    const errorMsg = error.response?.data?.error || error.message || 'Failed to sync cart with server';
                    set({ error: errorMsg, isLoading: false });
                    return false;
                }
            },

            preparePanierForCheckout: async (client_id) => {
                // Create a new server panier if we don't have one
                let panierId = get().panier_id;
                if (!panierId) {
                    panierId = await get().createServerPanier(client_id);
                }

                // Sync all items to the server
                await get().syncCartWithServer();

                return panierId;
            }
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);