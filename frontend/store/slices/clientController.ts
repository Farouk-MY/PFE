import { create } from "zustand";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuthStore} from "./auth";

// Types from auth.ts we need
export interface PurchaseHistoryItem {
    id: number;
    date: string;
    produits: {
        id: number;
        designation: string;
        quantite: number;
        prixUnitaire: number;
        prixOriginal?: number;
        remiseAppliquee: number;
        total: number;
        points: number;
        image?: string;
    }[];
    remise: number;
    pourcentageRemise: number | null;
    montantLivraison: number;
    montantTotal: number;
    pointsUtilises: number;
    pointsGagnes: number;
    statutLivraison: string;
    detailsLivraison?: any;
    methodePaiement?: string;
}

export interface PointsHistoryItem {
    commandeId: number;
    date: string;
    montantAchat: number;
    pointsGagnes: number;
    pointsUtilises: number;
    impact: number;
    soldePrecedent: number;
    soldeApres: number;
}

// Product and Category interfaces based on schema.prisma
export interface Product {
    id: number;
    designation: string;
    description?: string;
    images: string[];
    qteStock: number;
    prix: number;
    categoryId?: number;
    category?: Category;
    nbrPoint: number;
    seuilMin: number;
    deleted: boolean;
    avis?: ProductReview[];
    avgRating?: number;
}

export interface Category {
    id: number;
    name: string;
    _count?: {
        produits: number;
    };
}

export interface Favorite {
    id: number;
    clientId: number;
    produitId: number;
    produit: Product;
    addedAt: string;
}

export interface ProductReview {
    id: number;
    date: string;
    note: number;
    commentaire?: string;
    utilisateur: {
        id: string;
        nom: string;
        prenom: string;
    };
    produit_id?: number;
    produit?: {
        id: number;
        designation: string;
    };
}

// Review statistics interface
export interface ReviewStats {
    note_moyenne: number;
    nombre_avis: number;
    avis: ProductReview[];
}

// Global review stats interface
export interface GlobalReviewStats {
    stats_globales: {
        note_moyenne: number;
        nombre_total_avis: number;
    };
    top_produits: {
        produit_id: number;
        designation?: string;
        image?: string;
        note_moyenne: number;
        nombre_avis: number;
    }[];
}

// New interfaces for contact functionality
export interface ContactType {
    value: string;
    label: string;
}

export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    type?: string;
}

export interface ContactHistoryItem {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    type: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    history: {
        id: number;
        action: string;
        details: string;
        createdAt: string;
    }[];
}

// Client controller state interface
interface ClientControllerState {
    isLoading: boolean;
    error: string | null;
    purchaseHistory: PurchaseHistoryItem[];
    pointsHistory: { soldeActuel: number; historique: PointsHistoryItem[] } | null;
    products: Product[];
    categories: Category[];
    selectedCategory: number | null;
    searchQuery: string;
    trendingProducts: Product[];
    selectedProduct: Product | null;
    reviewStats: GlobalReviewStats | null;
    userReviews: ProductReview[];
    // New state for contact functionality
    contactTypes: ContactType[];
    contactSubmitSuccess: boolean;
    contactHistory: ContactHistoryItem[];
    favorites: Favorite[];
    isFavoriteLoading: boolean;

    // Original methods
    fetchPurchaseHistory: () => Promise<void>;
    fetchPointsHistory: () => Promise<void>;
    downloadInvoice: (commandeId: number) => Promise<void>;
    clearError: () => void;

    // New methods for products and categories
    fetchProducts: (categoryId?: number) => Promise<void>;
    fetchCategories: () => Promise<void>;
    fetchProductById: (productId: number) => Promise<void>;
    fetchTrendingProducts: () => Promise<void>;
    searchProducts: (query: string, categoryId?: number) => Promise<void>;
    setSelectedCategory: (categoryId: number | null) => void;
    setSearchQuery: (query: string) => void;

    // Review methods
    fetchProductReviews: (productId: number) => Promise<ReviewStats | undefined>;
    submitProductReview: (productId: number, note: number, commentaire?: string) => Promise<any>;
    fetchReviewStats: () => Promise<void>;
    fetchAllReviews: () => Promise<void>;
    fetchUserReviews: () => Promise<void>;
    updateReview: (reviewId: number, note: number, commentaire?: string) => Promise<any>;
    deleteReview: (reviewId: number) => Promise<boolean>;
    fetchReviewById: (reviewId: number) => Promise<ProductReview | null>;

    // New contact methods
    fetchContactTypes: () => Promise<void>;
    submitContactForm: (data: ContactFormData) => Promise<boolean>;
    fetchContactHistory: () => Promise<void>;
    resetContactSubmitStatus: () => void;

    // Favorites methods
    fetchFavorites: () => Promise<void>;
    addToFavorites: (productId: number) => Promise<boolean>;
    removeFromFavorites: (favoriteId: number) => Promise<boolean>;
    removeFromFavoritesByProductId: (productId: number) => Promise<boolean>;
    checkIsFavorite: (productId: number) => Promise<{isFavorite: boolean, favoriteId?: number}>;
}

export const useClientControllerStore = create<ClientControllerState>()((set, get) => ({
    isLoading: false,
    error: null,
    purchaseHistory: [],
    pointsHistory: null,
    products: [],
    categories: [],
    selectedCategory: null,
    searchQuery: '',
    trendingProducts: [],
    selectedProduct: null,
    reviewStats: null,
    userReviews: [],
    // Initialize new contact state
    contactTypes: [],
    contactSubmitSuccess: false,
    contactHistory: [],

    favorites: [],
    isFavoriteLoading: false,



    fetchFavorites: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return;

        set({ isFavoriteLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/favorites`
            );

            set({
                favorites: response.data,
                isFavoriteLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des favoris",
                isFavoriteLoading: false
            });
        }
    },

    addToFavorites: async (productId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return false;

        set({ isFavoriteLoading: true });
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/favorites`,
                { productId }
            );

            // Refresh the favorites list
            await get().fetchFavorites();

            set({ isFavoriteLoading: false });
            return true;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de l'ajout aux favoris",
                isFavoriteLoading: false
            });
            return false;
        }
    },

    removeFromFavorites: async (favoriteId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return false;

        set({ isFavoriteLoading: true });
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${favoriteId}`
            );

            // Refresh the favorites list
            await get().fetchFavorites();

            set({ isFavoriteLoading: false });
            return true;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la suppression du favori",
                isFavoriteLoading: false
            });
            return false;
        }
    },

    removeFromFavoritesByProductId: async (productId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return false;

        set({ isFavoriteLoading: true });
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/product/${productId}`
            );

            // Refresh the favorites list
            await get().fetchFavorites();

            set({ isFavoriteLoading: false });
            return true;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la suppression du favori",
                isFavoriteLoading: false
            });
            return false;
        }
    },

    checkIsFavorite: async (productId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return { isFavorite: false };

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/check/${productId}`
            );

            return response.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la vérification du favori"
            });
            return { isFavorite: false };
        }
    },

    // Original methods
    fetchPurchaseHistory: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) return;

        set({ isLoading: true });
        try {
            const userId = authStore.user.id;
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/clients/${userId}/historique`
            );

            // Process the response to ensure all products have discount information
            const processedHistory = response.data.map((item: PurchaseHistoryItem) => ({
                ...item,
                produits: item.produits.map(product => ({
                    ...product,
                    remiseAppliquee: product.remiseAppliquee || 0 // Use server value
                }))
            }));

            set({
                purchaseHistory: processedHistory,
                isLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération de l'historique d'achats",
                isLoading: false
            });
        }
    },

    fetchPointsHistory: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return;

        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/clients/points-history`
            );

            set({
                pointsHistory: response.data,
                isLoading: false
            });
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération de l'historique des points",
                isLoading: false
            });
        }
    },

    downloadInvoice: async (commandeId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) return;

        set({ isLoading: true });
        try {
            // Use fetch instead of axios as we need the blob response
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/commande/${commandeId}/facture`,
                {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Get the blob from the response
            const pdfBlob = await response.blob();

            // Use file-saver to download the PDF
            saveAs(pdfBlob, `facture-${commandeId}.pdf`);

            set({ isLoading: false });
        } catch (err: any) {
            console.error('Error downloading invoice:', err);
            set({
                error: err.message || "Une erreur est survenue lors du téléchargement de la facture",
                isLoading: false
            });
        }
    },

    // New methods for products and categories
    fetchProducts: async (categoryId?: number) => {
        set({ isLoading: true });
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/api/produit`;

            // If categoryId is provided, fetch products by category
            if (categoryId) {
                url = `${process.env.NEXT_PUBLIC_API_URL}/api/produit/category/${categoryId}`;
            }

            const response = await axios.get(url);

            if (response.data.success) {
                set({
                    products: response.data.data,
                    isLoading: false,
                    selectedCategory: categoryId || get().selectedCategory
                });
            } else {
                throw new Error("Failed to fetch products");
            }
        } catch (err: any) {
            console.error("Error fetching products:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des produits",
                isLoading: false
            });
        }
    },

    fetchCategories: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/categories`
            );

            if (response.data.success) {
                set({
                    categories: response.data.data,
                    isLoading: false
                });
            } else {
                throw new Error("Failed to fetch categories");
            }
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des catégories",
                isLoading: false
            });
        }
    },


    fetchProductById: async (productId: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/produit/${productId}`
            );

            if (response.data.success) {
                // Store the product data
                const productData = response.data.data;

                // Fetch reviews for the product
                const reviewsResponse = await get().fetchProductReviews(productId);

                // Combine product data with reviews
                const productWithReviews = {
                    ...productData,
                    avis: reviewsResponse ? reviewsResponse.avis || [] : [],
                    avgRating: reviewsResponse ? reviewsResponse.note_moyenne || 0 : 0
                };

                set({
                    selectedProduct: productWithReviews,
                    isLoading: false
                });
            } else {
                throw new Error("Failed to fetch product");
            }
        } catch (err: any) {
            console.error("Error fetching product:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération du produit",
                isLoading: false
            });
        }
    },

    fetchTrendingProducts: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/produits/tendance`
            );

            if (response.data.success) {
                set({
                    trendingProducts: response.data.data,
                    isLoading: false
                });
            } else {
                throw new Error("Failed to fetch trending products");
            }
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des produits tendance",
                isLoading: false
            });
        }
    },

    searchProducts: async (query: string, categoryId?: number) => {
        set({ isLoading: true, searchQuery: query });
        try {
            // Build the URL with query parameters
            let url = `${process.env.NEXT_PUBLIC_API_URL}/api/produits/search?query=${encodeURIComponent(query)}`;

            // Add category filter if provided
            if (categoryId) {
                url += `&categoryId=${categoryId}`;
            }

            const response = await axios.get(url);

            if (response.data.success) {
                set({
                    products: response.data.data,
                    isLoading: false
                });
            } else {
                throw new Error("Failed to search products");
            }
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la recherche des produits",
                isLoading: false
            });
        }
    },

    setSelectedCategory: (categoryId: number | null) => {
        set({ selectedCategory: categoryId });

        // If a category is selected, fetch products for that category
        if (categoryId !== null) {
            get().fetchProducts(categoryId);
        } else {
            // If no category is selected, fetch all products
            get().fetchProducts();
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });

        // If query is not empty, search products
        if (query.trim()) {
            get().searchProducts(query, get().selectedCategory || undefined);
        } else {
            // If query is empty, fetch products based on selected category
            get().fetchProducts(get().selectedCategory || undefined);
        }
    },

    // Review methods
    fetchProductReviews: async (productId: number) => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis/produit/${productId}`
            );

            // Return the review data for potential use elsewhere
            return response.data as ReviewStats;
        } catch (err: any) {
            console.error("Error fetching product reviews:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des avis",
            });
            return undefined;
        }
    },

    submitProductReview: async (productId: number, note: number, commentaire?: string) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) {
            throw new Error("You must be logged in to submit a review");
        }

        set({ isLoading: true });
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis`,
                {
                    note,
                    commentaire,
                    utilisateur_id: authStore.user.id,
                    produit_id: productId
                }
            );

            // After submitting review, refresh product data with updated reviews
            await get().fetchProductById(productId);

            // Also refresh user reviews if we're maintaining that state
            await get().fetchUserReviews();

            set({ isLoading: false });
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error ||
                (err.response?.status === 409 ?
                    "You have already reviewed this product" :
                    "Une erreur est survenue lors de l'envoi de l'avis");

            set({
                error: errorMessage,
                isLoading: false
            });
            throw new Error(errorMessage);
        }
    },

    fetchReviewStats: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis/stats`
            );

            set({
                reviewStats: response.data,
                isLoading: false
            });

            return response.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des statistiques d'avis",
                isLoading: false
            });
        }
    },

    // New methods for review management
    fetchAllReviews: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis`
            );

            // Store reviews in products state if needed or process them further
            // For now, we'll just return the data
            set({ isLoading: false });
            return response.data.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des avis",
                isLoading: false
            });
        }
    },

    fetchUserReviews: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) return;

        set({ isLoading: true });
        try {
            // This endpoint isn't explicitly defined in the provided code but would be useful
            // You might need to create it on the backend
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis?utilisateur_id=${authStore.user.id}`
            );

            set({
                userReviews: response.data.data,
                isLoading: false
            });

            return response.data.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération de vos avis",
                isLoading: false
            });
        }
    },

    updateReview: async (reviewId: number, note: number, commentaire?: string) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) {
            throw new Error("You must be logged in to update a review");
        }

        set({ isLoading: true });
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis/${reviewId}`,
                {
                    note,
                    commentaire
                }
            );

            // Refresh the user's reviews
            await get().fetchUserReviews();

            // If we have a selected product and the review belongs to it, refresh the product
            const reviewData = response.data.data;
            const selectedProduct = get().selectedProduct;

            // Make sure both reviewData, selectedProduct exist and then check produit_id
            if (reviewData &&
                reviewData.produit_id !== undefined &&
                selectedProduct !== null &&
                reviewData.produit_id === selectedProduct.id) {
                await get().fetchProductById(reviewData.produit_id);
            }

            set({ isLoading: false });
            return response.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la mise à jour de l'avis",
                isLoading: false
            });
            throw err;
        }
    },

    deleteReview: async (reviewId: number) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) {
            throw new Error("You must be logged in to delete a review");
        }

        set({ isLoading: true });
        try {
            // First, get the review to check the product ID
            const review = await get().fetchReviewById(reviewId);
            // Store product ID safely with explicit null check
            const productId = review ? review.produit_id : undefined;

            // Delete the review
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis/${reviewId}`
            );

            // Refresh the user's reviews
            await get().fetchUserReviews();

            // Using strict null checks for all values in the condition
            const selectedProduct = get().selectedProduct;
            if (productId !== undefined && selectedProduct !== null && productId === selectedProduct.id) {
                await get().fetchProductById(productId);
            }

            set({ isLoading: false });
            return true;
        } catch (err: any) {
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la suppression de l'avis",
                isLoading: false
            });
            return false;
        }
    },

    fetchReviewById: async (reviewId: number) => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/avis/${reviewId}`
            );

            return response.data.data as ProductReview;
        } catch (err: any) {
            console.error("Error fetching review:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération de l'avis",
            });
            return null;
        }
    },

    // New methods for contact functionality
    fetchContactTypes: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contact/types`
            );

            set({
                contactTypes: response.data,
                isLoading: false
            });
        } catch (err: any) {
            console.error("Error fetching contact types:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération des types de contact",
                isLoading: false
            });
        }
    },

    submitContactForm: async (data: ContactFormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contact`,
                data
            );

            if (response.data.success) {
                set({
                    contactSubmitSuccess: true,
                    isLoading: false
                });
                return true;
            } else {
                throw new Error(response.data.message || "Failed to submit contact form");
            }
        } catch (err: any) {
            console.error("Error submitting contact form:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de l'envoi du formulaire de contact",
                isLoading: false,
                contactSubmitSuccess: false
            });
            return false;
        }
    },

    fetchContactHistory: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token || !authStore.user) return;

        set({ isLoading: true });
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contact/history?email=${authStore.user.email}`
            );

            set({
                contactHistory: response.data,
                isLoading: false
            });
        } catch (err: any) {
            console.error("Error fetching contact history:", err);
            set({
                error: err.response?.data?.error || "Une erreur est survenue lors de la récupération de l'historique des contacts",
                isLoading: false
            });
        }
    },

    resetContactSubmitStatus: () => {
        set({ contactSubmitSuccess: false });
    },

    clearError: () => set({ error: null })
}));