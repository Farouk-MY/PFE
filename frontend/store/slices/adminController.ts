import { create } from "zustand";
import axios from "axios";
import Cookies from "js-cookie";

// Define extended User type with customer fields
export interface User {
    id: string;
    nom?: string;
    prenom?: string;
    email: string;
    telephone?: string;
    adresse?: string;
    statut?: string;
    dateCreation?: string;
    commandes?: number;
    totalDepense?: number;
    derniereCommande?: string;
    points?: number;
}

// Define Contact related interfaces
export interface Contact {
    id: number;
    name: string;
    email: string;
    type: string;
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    history: ContactHistory[];
    replies: ContactReply[];
}

export interface ContactHistory {
    id: number;
    contactId: number;
    action: string;
    details: string;
    date: string;
}

export interface ContactReply {
    id: number;
    contactId: number;
    staff: string;
    content: string;
    date: string;
}

export interface ContactStats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    highPriority: number;
    today: number;
}

// Define Product interface with added fields
export interface Product {
    id: number;
    designation: string;
    description?: string;
    images: string[];
    qteStock: number;
    prix: number;
    nbrPoint: number;
    seuilMin: number;
    deleted: boolean;
    remise?: number;
    categoryId?: number;
    category?: {
        id: number;
        name: string;
    };
    avis?: ProductReview[];
    avgRating?: number;
    purchaseCount?: number;
    totalPurchases?: number;
}

// Interface for product reviews
export interface ProductReview {
    id: number;
    note: number;
    commentaire?: string;
    utilisateurId: string;
    produitId: number;
    dateCreation: Date;
    utilisateur?: {
        id: string;
        nom?: string;
        prenom?: string;
    };
}

// Interface for product categories
export interface Category {
    _count?: {
        produits?: number;
    };
    id: number;
    name: string;
}

// Define types for admin operations
interface AdminControllerState {
    isLoading: boolean;
    error: string | null;
    users: User[];
    products: Product[];
    categories: Category[];
    contacts: Contact[];
    contactStats: ContactStats | null;

    // User management functions
    getAllUsers: () => Promise<User[]>;
    getUserById: (id: string) => Promise<User | null>;
    searchUsers: (query: string) => Promise<User[]>;
    blockUser: (id: string) => Promise<boolean>;
    unblockUser: (id: string) => Promise<boolean>;

    // Product management functions
    getAllProducts: () => Promise<Product[]>;
    getLowStockProducts: () => Promise<Product[]>;
    getTrendingProducts: () => Promise<Product[]>;
    getProductById: (id: number) => Promise<Product | null>;
    getProductDashboard: (id: number) => Promise<Product | null>;
    createProduct: (productData: FormData) => Promise<Product | null>;
    updateProduct: (id: number, productData: FormData) => Promise<Product | null>;
    deleteProduct: (id: number) => Promise<boolean>;
    hardDeleteProduct: (id: number) => Promise<boolean>;
    searchProducts: (query: string, categoryId?: string) => Promise<Product[]>;
    updateStock: (id: number, qteStock: number) => Promise<Product | null>;
    getProductsByCategory: (categoryId: number) => Promise<Product[]>;

    // Category management functions
    getAllCategories: () => Promise<Category[]>;
    createCategory: (name: string) => Promise<Category | null>;
    updateCategory: (id: number, name: string) => Promise<Category | null>;
    deleteCategory: (id: number) => Promise<boolean>;
    searchCategories: (query: string) => Promise<Category[]>;
    getCategoryById: (id: number) => Promise<Category | null>;

    // Contact management functions
    getAllContacts: (filters?: any) => Promise<Contact[]>;
    getContactById: (id: number) => Promise<Contact | null>;
    updateContactStatus: (id: number, status: 'pending' | 'in_progress' | 'resolved') => Promise<Contact | null>;
    updateContactPriority: (id: number, priority: 'low' | 'medium' | 'high') => Promise<Contact | null>;
    replyToContact: (id: number, content: string) => Promise<boolean>;
    deleteContact: (id: number) => Promise<boolean>;
    getContactStats: () => Promise<ContactStats | null>;

    // Export functions
    exportUsers: (format: 'csv' | 'pdf') => Promise<void>;

    // Admin profile
    getAdminProfile: () => Promise<any>;

    // Utility functions
    clearError: () => void;
}

export const useAdminControllerStore = create<AdminControllerState>((set, get) => ({
    isLoading: false,
    error: null,
    users: [],
    products: [],
    categories: [],
    contacts: [],
    contactStats: null,

    // User management functions
    getAllUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/all`);
            const users = response.data.users;
            set({ users, isLoading: false });
            return users;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des utilisateurs";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getUserById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
            set({ isLoading: false });
            return response.data.user;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération de l'utilisateur";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    searchUsers: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search`, {
                params: { query }
            });
            const users = response.data.users;
            set({ isLoading: false });
            return users;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la recherche des utilisateurs";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    blockUser: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/block`);

            // Update the user in the local state
            set(state => ({
                users: state.users.map(user =>
                    user.id === id ? { ...user, statut: 'bloqué' } : user
                ),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors du blocage de l'utilisateur";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    unblockUser: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/unblock`);

            // Update the user in the local state
            set(state => ({
                users: state.users.map(user =>
                    user.id === id ? { ...user, statut: 'actif' } : user
                ),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors du déblocage de l'utilisateur";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    // Product management functions
    getAllProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit`);
            const products = response.data.data;
            set({ products, isLoading: false });
            return products;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des produits";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getLowStockProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/admin/produits-faibles`);
            const products = response.data.data;
            set({ isLoading: false });
            return products;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des produits en stock faible";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getTrendingProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/produits/tendance`);
            const products = response.data.data;
            set({ isLoading: false });
            return products;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des produits tendance";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getProductById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/${id}`);
            set({ isLoading: false });
            return response.data.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération du produit";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    getProductDashboard: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/admin/produit/${id}`);
            set({ isLoading: false });
            return response.data.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération du tableau de bord du produit";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    createProduct: async (productData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/produit`,
                productData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const newProduct = response.data.data;

            // Update products list in state
            set(state => ({
                products: [...state.products, newProduct],
                isLoading: false
            }));

            return newProduct;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la création du produit";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    updateProduct: async (id: number, productData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/produit/${id}`,
                productData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const updatedProduct = response.data.data;

            // Update the product in the local state
            set(state => ({
                products: state.products.map(product =>
                    product.id === id ? updatedProduct : product
                ),
                isLoading: false
            }));

            return updatedProduct;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour du produit";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    deleteProduct: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/${id}`);

            // Update the products state by marking the product as deleted
            set(state => ({
                products: state.products.map(product =>
                    product.id === id ? { ...product, deleted: true } : product
                ),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la suppression du produit";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    hardDeleteProduct: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/${id}/permanent`);

            // Remove the product from state
            set(state => ({
                products: state.products.filter(product => product.id !== id),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la suppression permanente du produit";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    searchProducts: async (query: string, categoryId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const params: Record<string, string> = { query };
            if (categoryId) {
                params.categoryId = categoryId;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/search`, {
                params
            });
            const products = response.data.data;
            set({ isLoading: false });
            return products;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la recherche des produits";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    updateStock: async (id: number, qteStock: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/produit/admin/produit/${id}/stock`,
                { qteStock }
            );

            const updatedProduct = response.data.data;

            // Update the product in the local state
            set(state => ({
                products: state.products.map(product =>
                    product.id === id ? { ...product, qteStock } : product
                ),
                isLoading: false
            }));

            return updatedProduct;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour du stock";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    getProductsByCategory: async (categoryId: number | string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/produit/category/${categoryId}`);
            const products = response.data.data;
            set({ isLoading: false });
            return products;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des produits par catégorie";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getCategoryById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`);
            set({ isLoading: false });
            return response.data.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération de la catégorie";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    // Category management functions
    getAllCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
            const categories = response.data.data;
            set({ categories, isLoading: false });
            return categories;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des catégories";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    searchCategories: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/search/query`, {
                params: { query }
            });
            const categories = response.data.data;
            set({ isLoading: false });
            return categories;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la recherche des catégories";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    createCategory: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { name });
            const newCategory = response.data.data;

            // Update categories list in state
            set(state => ({
                categories: [...state.categories, newCategory],
                isLoading: false
            }));

            return newCategory;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la création de la catégorie";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    updateCategory: async (id: number, name: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`, { name });
            const updatedCategory = response.data.data;

            // Update the category in the local state
            set(state => ({
                categories: state.categories.map(category =>
                    category.id === id ? updatedCategory : category
                ),
                isLoading: false
            }));

            return updatedCategory;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour de la catégorie";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    deleteCategory: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`);

            // Remove the category from state
            set(state => ({
                categories: state.categories.filter(category => category.id !== id),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la suppression de la catégorie";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    // Contact management functions
    getAllContacts: async (filters: any = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts`, {
                params: filters
            });

            const contacts = response.data.contacts;
            set({ contacts, isLoading: false });
            return contacts;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des contacts";
            set({ error: errorMsg, isLoading: false });
            return [];
        }
    },

    getContactById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/${id}`);
            set({ isLoading: false });
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération du contact";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    updateContactStatus: async (id: number, status: 'pending' | 'in_progress' | 'resolved') => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/${id}/status`,
                { status }
            );

            // Update the contact in the local state
            set(state => ({
                ...state,
                contacts: state.contacts.map(contact =>
                    contact.id === id ? { ...contact, status } : contact
                ),
                isLoading: false
            }));

            return response.data.contact;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour du statut du contact";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    updateContactPriority: async (id: number, priority: 'low' | 'medium' | 'high') => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/${id}/priority`,
                { priority }
            );

            // Update the contact in the local state
            set(state => ({
                ...state,
                contacts: state.contacts.map(contact =>
                    contact.id === id ? { ...contact, priority } : contact
                ),
                isLoading: false
            }));

            return response.data.contact;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la mise à jour de la priorité du contact";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    replyToContact: async (id: number, content: string) => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/${id}/reply`,
                { content }
            );

            set({ isLoading: false });
            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de l'envoi de la réponse";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    deleteContact: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/${id}`);

            // Remove the contact from state
            set(state => ({
                contacts: state.contacts.filter(contact => contact.id !== id),
                isLoading: false
            }));

            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la suppression du contact";
            set({ error: errorMsg, isLoading: false });
            return false;
        }
    },

    getContactStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/contacts/stats`);
            const stats = response.data;
            set({ contactStats: stats, isLoading: false });
            return stats;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération des statistiques de contact";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    exportUsers: async (format: 'csv' | 'pdf') => {
        set({ isLoading: true, error: null });
        try {
            // Get the token from cookie first (matching adminAuth.ts approach)
            let token = Cookies.get('admin-auth-token');

            // If no cookie token, try local storage as fallback
            if (!token) {
                const storedState = localStorage.getItem('admin-auth-storage');
                if (storedState) {
                    try {
                        const parsedState = JSON.parse(storedState);
                        token = parsedState.state.token;
                    } catch (e) {
                        console.error('Error parsing auth storage', e);
                    }
                }
            }

            // Use Axios for the request with proper authorization header
            const response = await axios({
                url: `${process.env.NEXT_PUBLIC_API_URL}/api/export-users/${format}`,
                method: 'GET',
                responseType: 'blob', // Important for handling file downloads
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            // Create a URL for the blob response
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users.${format}`);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            set({ isLoading: false });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || `Erreur lors de l'exportation des utilisateurs en ${format}`;
            set({ error: errorMsg, isLoading: false });
        }
    },

    getAdminProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admins/me`);
            set({ isLoading: false });
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Erreur lors de la récupération du profil admin";
            set({ error: errorMsg, isLoading: false });
            return null;
        }
    },

    clearError: () => set({ error: null })
}));