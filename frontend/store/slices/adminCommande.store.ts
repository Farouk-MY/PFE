import { create } from 'zustand';
import axios from 'axios';
import { useAdminAuthStore } from './adminAuth';

// Define types for order status
export type OrderStatus = 'en_attente' | 'en_preparation' | 'en_cours_livraison' | 'livrée' | 'annulée';

// Define types for API responses
export interface OrderItem {
    id: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    image: string | null;
}

export interface OrderDetails {
    id: number;
    orderInfo: {
        date: string | null;
        deliveryDate: string | null;
        status: OrderStatus | 'unknown';
        deliveryAddress: string;
        deliveryPerson: string;
    };
    clientInfo: {
        id: number;
        name: string;
        email: string;
        phone: string;
        address: {
            city: string;
            postalCode: string;
            governorate: string;
        };
    };
    paymentInfo: {
        method: string;
        status: string;
        date: string | null;
        cardDetails: string | null;
    };
    financialInfo: {
        subtotal: number;
        discount: number;
        discountPercentage: number;
        pointsUsed: number;
        pointsAmount: number;
        deliveryFee: number;
        totalAmount: number;
        pointsEarned: number;
    };
    items: OrderItem[];
}

// For partial updates to avoid TypeScript errors
export type PartialOrderDetails = Partial<OrderDetails> & { id: number };

export interface OrderSummary {
    id: number;
    date: string | null;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    total: number;
    status: OrderStatus | 'unknown';
    paymentMethod: string;
    paymentStatus: string;
}

export interface OrdersResponse {
    orders: OrderSummary[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface OrderStatistics {
    totalOrders: number;
    statusCounts: Record<string, number>;
    revenue: {
        total: number;
    };
    trends: {
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
}

interface AdminCommandeState {
    // State
    isLoading: boolean;
    error: string | null;
    orders: OrderSummary[];
    currentOrder: OrderDetails | null;
    orderStatistics: OrderStatistics | null;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };

    // Filters
    searchTerm: string;
    statusFilter: string;
    sortOrder: 'asc' | 'desc';

    // Actions
    getAllOrders: (page?: number, limit?: number) => Promise<OrdersResponse>;
    getOrderDetails: (orderId: number) => Promise<OrderDetails>;
    updateOrderStatus: (orderId: number, status: OrderStatus, deliveryPerson?: string) => Promise<boolean>;
    getOrderStatistics: () => Promise<OrderStatistics>;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (status: string) => void;
    setSortOrder: (sort: 'asc' | 'desc') => void;
    resetFilters: () => void;
    resetCurrentOrder: () => void;
}

export const useAdminCommandeStore = create<AdminCommandeState>((set, get) => ({
    // Initial state
    isLoading: false,
    error: null,
    orders: [],
    currentOrder: null,
    orderStatistics: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
    },

    // Initial filter values
    searchTerm: '',
    statusFilter: '',
    sortOrder: 'desc',

    // Actions
    getAllOrders: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAdminAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated as admin');

            const { searchTerm, statusFilter, sortOrder } = get();

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders`,
                {
                    params: {
                        page,
                        limit,
                        sort: sortOrder,
                        search: searchTerm,
                        status: statusFilter
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({
                orders: response.data.orders,
                pagination: response.data.pagination,
                isLoading: false
            });

            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch orders';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    getOrderDetails: async (orderId) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAdminAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated as admin');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({ currentOrder: response.data, isLoading: false });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch order details';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    updateOrderStatus: async (orderId, status, deliveryPerson) => {
        set({ isLoading: true, error: null });
        try {
            const token = useAdminAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated as admin');

            const payload: { status: OrderStatus; nomLivreur?: string } = { status };
            if (deliveryPerson) {
                payload.nomLivreur = deliveryPerson;
            }

            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/status`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // If we have the current order loaded and it matches the one we're updating
            const currentOrder = get().currentOrder;
            if (currentOrder && currentOrder.id === orderId) {
                // Create updated order with all required fields
                const updatedOrder: OrderDetails = {
                    ...currentOrder,
                    orderInfo: {
                        ...currentOrder.orderInfo,
                        status,
                        deliveryPerson: deliveryPerson || currentOrder.orderInfo.deliveryPerson
                    }
                };

                set({ currentOrder: updatedOrder });
            }

            // Refresh the order list to reflect the update
            if (get().orders.length > 0) {
                await get().getAllOrders(get().pagination.page, get().pagination.limit);
            }

            set({ isLoading: false });
            return true;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update order status';
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    getOrderStatistics: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = useAdminAuthStore.getState().token;
            if (!token) throw new Error('Not authenticated as admin');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/statistics`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            set({ orderStatistics: response.data, isLoading: false });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch order statistics';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    // Filter and sort actions
    setSearchTerm: (term) => {
        set({ searchTerm: term });
    },

    setStatusFilter: (status) => {
        set({ statusFilter: status });
    },

    setSortOrder: (sort) => {
        set({ sortOrder: sort });
    },

    resetFilters: () => {
        set({
            searchTerm: '',
            statusFilter: '',
            sortOrder: 'desc'
        });
    },

    resetCurrentOrder: () => {
        set({ currentOrder: null });
    }
}));