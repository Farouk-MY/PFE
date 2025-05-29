import { useAuthStore } from './slices/auth';
import { useAdminAuthStore } from './slices/adminAuth';
import { useAdminControllerStore } from './slices/adminController';
import { useClientControllerStore } from './slices/clientController';
import { useCartStore } from './slices/cartStore';
import { useMessagerieStore } from './slices/messagerie.store';
import { useCommandeStore } from './slices/commande.store';
import { useAdminCommandeStore } from './slices/adminCommande.store';
import { useStatisticsStore } from './slices/statistiques.store';
import { useChatStore } from './slices/chat.store';
import { useDocumentStore } from './slices/document.store';

export {
    useAuthStore,
    useAdminAuthStore,
    useAdminControllerStore,
    useClientControllerStore,
    useCartStore,
    useMessagerieStore,
    useCommandeStore,
    useAdminCommandeStore,
    useStatisticsStore,
    useChatStore,
    useDocumentStore
};

// Export types from stores
export type {
    User,
    SignupData,
} from './slices/auth';

export type {
    AdminUser,
    AdminProfile
} from './slices/adminAuth';

// Export types from adminController
export type {
    User as CustomerUser,
    Product,
    Contact,
    ContactHistory,
    ContactReply,
    ContactStats
} from './slices/adminController';

export type {
    PurchaseHistoryItem,
    PointsHistoryItem,
    Product as ClientProduct,
    ProductReview,
    // New contact types
    ContactType,
    ContactFormData,
    ContactHistoryItem,
    Favorite
} from './slices/clientController';

// Export types from cartStore
export type {
    CartItem
} from './slices/cartStore';

// Export types from chat store
export type {
    ChatMessage,
    ChatResponse
} from './slices/chat.store';

// Export types from adminCommande.store
export type {
    OrderStatus,
    OrderItem,
    OrderDetails,
    OrderSummary,
    OrdersResponse,
    OrderStatistics
} from './slices/adminCommande.store';

// Export types from document.store
export type {
    Document
} from './slices/document.store';