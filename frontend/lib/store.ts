import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Address, PaymentMethod, CheckoutState } from "./types";

// Recommendation type based on the component implementation
interface Recommendation {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  confidence: number;
  description: string;
  tags: string[];
}

interface RecommendationsState {
  recommendations: Recommendation[];
  loading: boolean;
  generateRecommendations: () => void;
}

// Sample enhanced recommendations data (same as in the component)
const demoRecommendations = [
  {
    id: 1,
    name: "Quantum X Pro Gaming Laptop",
    price: 2499.99,
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
    category: "Laptops",
    rating: 4.8,
    reviews: 124,
    confidence: 0.95,
    description:
      "Cutting-edge gaming laptop with Neural X9 processor and RTX 5080 Ti graphics",
    tags: ["Gaming", "High Performance", "Premium"],
  },
  {
    id: 2,
    name: "Neural GPU 32GB",
    price: 1999.99,
    image:
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
    category: "Components",
    rating: 4.9,
    reviews: 89,
    confidence: 0.92,
    description:
      "Next-generation graphics card with 24576 CUDA cores and 32GB GDDR7 memory",
    tags: ["Gaming", "Content Creation", "AI"],
  },
  {
    id: 3,
    name: "HoloLens Pro AR",
    price: 1299.99,
    image:
      "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
    category: "AR/VR",
    rating: 4.7,
    reviews: 156,
    confidence: 0.88,
    description:
      "Immersive augmented reality headset with 8K resolution and 150° field of view",
    tags: ["AR/VR", "Innovation", "Entertainment"],
  },
  {
    id: 4,
    name: "Quantum Core Desktop",
    price: 3499.99,
    image:
      "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800",
    category: "Desktops",
    rating: 4.9,
    reviews: 78,
    confidence: 0.91,
    description:
      "Ultimate desktop powerhouse with Quantum i13 processor and liquid nitrogen cooling",
    tags: ["Workstation", "Gaming", "Premium"],
  },
  {
    id: 5,
    name: "Neural Haptic Controller",
    price: 299.99,
    image:
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=800",
    category: "Gaming",
    rating: 4.8,
    reviews: 245,
    confidence: 0.87,
    description:
      "Advanced gaming controller with neural feedback and 100-hour battery life",
    tags: ["Gaming", "Accessories", "Innovation"],
  },
];

export const useRecommendationsStore = create<RecommendationsState>()(
  persist(
    (set) => ({
      recommendations: demoRecommendations,
      loading: false,
      generateRecommendations: () => {
        // Set loading state to true
        set({ loading: true });

        // Simulate API call with a timeout
        setTimeout(() => {
          // Shuffle the recommendations array to simulate new recommendations
          const shuffledRecommendations = [...demoRecommendations]
            .sort(() => Math.random() - 0.5)
            .map((rec) => ({
              ...rec,
              confidence: Math.max(
                0.75,
                Math.min(0.98, rec.confidence + (Math.random() * 0.1 - 0.05)),
              ),
            }));

          // Update state with new recommendations and set loading to false
          set({
            recommendations: shuffledRecommendations,
            loading: false,
          });
        }, 2000); // 2 second delay to simulate loading
      },
    }),
    {
      name: "recommendations-storage", // Storage key for localStorage
    },
  ),
);

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: number;
  suggestions?: string[];
  productLinks?: { name: string; url: string }[];
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  toggleChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
              ...message,
            },
          ],
        })),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "chat-storage",
    },
  ),
);

interface UserState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    notifications?: number;
    unreadMessages?: number;
    points?: number; // Available reward points
    orders?: {
      total: number;
      pending: number;
    };
    addresses?: Address[];
    paymentMethods?: PaymentMethod[];
    preferences: {
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
      theme: "light" | "dark" | "system";
    };
  };
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserState["user"]>) => void;
  updatePoints: (points: number) => void;
  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  updatePreferences: (
    preferences: Partial<UserState["user"]["preferences"]>,
  ) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: {
        points: 0,
        addresses: [],
        paymentMethods: [],
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          theme: "system",
        },
      },
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({
          isAuthenticated: true,
          user: {
            id: "1",
            name: "John Doe",
            email,
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            notifications: 3,
            unreadMessages: 2,
            points: 1500,
            orders: {
              total: 12,
              pending: 3,
            },
            addresses: [
              {
                id: "1",
                name: "Home",
                street: "123 Main St",
                city: "New York",
                state: "NY",
                zipCode: "10001",
                country: "United States",
                phone: "+1 234 567 8900",
                isDefault: true,
              },
            ],
            paymentMethods: [
              {
                id: "1",
                type: "card",
                last4: "4242",
                brand: "visa",
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true,
              },
            ],
            preferences: {
              notifications: {
                email: true,
                push: true,
                sms: false,
              },
              theme: "system",
            },
          },
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: {
            preferences: {
              notifications: {
                email: true,
                push: true,
                sms: false,
              },
              theme: "system",
            },
          },
        });
      },
      updateProfile: (data) =>
        set((state) => ({
          user: {
            ...state.user,
            ...data,
          },
        })),
      updatePoints: (points) =>
        set((state) => ({
          user: {
            ...state.user,
            points: (state.user.points || 0) + points,
          },
        })),
      addAddress: (address) =>
        set((state) => ({
          user: {
            ...state.user,
            addresses: [...(state.user.addresses || []), address],
          },
        })),
      removeAddress: (id) =>
        set((state) => ({
          user: {
            ...state.user,
            addresses:
              state.user.addresses?.filter((addr) => addr.id !== id) || [],
          },
        })),
      addPaymentMethod: (method) =>
        set((state) => ({
          user: {
            ...state.user,
            paymentMethods: [...(state.user.paymentMethods || []), method],
          },
        })),
      removePaymentMethod: (id) =>
        set((state) => ({
          user: {
            ...state.user,
            paymentMethods:
              state.user.paymentMethods?.filter((method) => method.id !== id) ||
              [],
          },
        })),
      updatePreferences: (preferences) =>
        set((state) => ({
          user: {
            ...state.user,
            preferences: {
              ...state.user.preferences,
              ...preferences,
            },
          },
        })),
    }),
    {
      name: "user-storage",
    },
  ),
);

interface CheckoutStore {
  state: CheckoutState;
  setAddress: (address: Address) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPointsToRedeem: (points: number) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  state: {
    address: null,
    paymentMethod: null,
    pointsToRedeem: 0,
    notes: "",
  },
  setAddress: (address) =>
    set((state) => ({ state: { ...state.state, address } })),
  setPaymentMethod: (paymentMethod) =>
    set((state) => ({ state: { ...state.state, paymentMethod } })),
  setPointsToRedeem: (pointsToRedeem) =>
    set((state) => ({ state: { ...state.state, pointsToRedeem } })),
  setNotes: (notes) => set((state) => ({ state: { ...state.state, notes } })),
  reset: () =>
    set({
      state: {
        address: null,
        paymentMethod: null,
        pointsToRedeem: 0,
        notes: "",
      },
    }),
}));
