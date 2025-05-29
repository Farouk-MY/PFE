// src/stores/statistiques.store.ts
import { create } from 'zustand';
import axios from 'axios';

interface StatisticsState {
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    avgOrderValue: number;
    salesData: { month: string; sales: number; profit: number; customers: number }[];
    revenueData: { month: string; revenue: number }[];
    categoryData: { name: string; value: number }[];
    trafficData: { name: string; value: number }[];
    recentOrders: any[];
    pendingOrders: number;
    loading: boolean;
    error: string | null;
    fetchStatistics: () => Promise<void>;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    avgOrderValue: 0,
    salesData: [],
    revenueData: [],
    categoryData: [],
    trafficData: [],
    recentOrders: [],
    pendingOrders: 0,
    loading: false,
    error: null,

    fetchStatistics: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/statistics`);

            // Transform sales data into revenue data format
            const revenueData = response.data.salesData.map((monthData: any) => ({
                month: monthData.month,
                revenue: monthData.sales,
            }));

            set({
                totalRevenue: response.data.totalRevenue,
                totalOrders: response.data.totalOrders,
                newCustomers: response.data.newCustomers,
                avgOrderValue: response.data.avgOrderValue,
                salesData: response.data.salesData,
                revenueData,
                categoryData: response.data.categoryData,
                trafficData: response.data.trafficData,
                recentOrders: response.data.recentOrders,
                pendingOrders: response.data.pendingOrders,
                loading: false,
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.error || 'Failed to fetch statistics',
                loading: false,
            });
        }
    },
}));