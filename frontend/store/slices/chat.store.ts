import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

// Define types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  context?: string[];
  sources?: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Send a message to the chatbot
  sendMessage: (message: string) => Promise<void>;

  // Track an order (requires authentication)
  trackOrder: (orderId: string) => Promise<void>;

  // Clear chat history
  clearChat: () => void;

  // Clear error state
  clearError: () => void;
}

// Create the chat store
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,

      sendMessage: async (message: string) => {
        try {
          set({ isLoading: true, error: null });
          const currentMessages = get().messages;

          // Add user message to chat history
          set({
            messages: [...currentMessages, { role: "user", content: message }]
          });

          // Prepare the request payload
          const payload = {
            query: message,
            history: currentMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          };

          // Get the authentication token
          const token = localStorage.getItem("auth_token") || null;

          // Choose the appropriate endpoint based on authentication status
          const endpoint = token
            ? `${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/auth-chat/chat` // Authenticated endpoint
            : `${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/chat/chat`;    // Non-authenticated endpoint

          // Set up request headers
          const headers: Record<string, string> = {
            "Content-Type": "application/json"
          };

          // Add authorization header if token exists
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          // Send the request to the appropriate endpoint
          const response = await axios.post<ChatResponse>(
            endpoint,
            payload,
            { headers }
          );

          // Add assistant response to chat history
          set({
            messages: [
              ...get().messages,
              { role: "assistant", content: response.data.answer }
            ],
            isLoading: false
          });
        } catch (error) {
          console.error("Error sending message:", error);
          set({
            error: "Failed to send message. Please try again.",
            isLoading: false
          });
        }
      },

      trackOrder: async (orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          const currentMessages = get().messages;

          // Add user message to chat history
          const trackingMessage = `Track my order #${orderId}`;
          set({
            messages: [...currentMessages, { role: "user", content: trackingMessage }]
          });

          // Get the authentication token
          const token = localStorage.getItem("auth_token");

          // Check if user is authenticated
          if (!token) {
            // If not authenticated, add a message explaining authentication is required
            set({
              messages: [
                ...get().messages,
                {
                  role: "assistant",
                  content: "You need to be logged in to track your orders. Please sign in to your account first."
                }
              ],
              isLoading: false
            });
            return;
          }

          // Prepare the request payload
          const payload = {
            query: trackingMessage,
            history: currentMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            metadata: {
              orderId: orderId
            }
          };

          // Send the request to the order tracking endpoint
          const response = await axios.post<ChatResponse>(
            `${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/auth-chat/order-tracking`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            }
          );

          // Add assistant response to chat history
          set({
            messages: [
              ...get().messages,
              { role: "assistant", content: response.data.answer }
            ],
            isLoading: false
          });
        } catch (error) {
          console.error("Error tracking order:", error);

          // Handle unauthorized errors specifically
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            set({
              messages: [
                ...get().messages,
                {
                  role: "assistant",
                  content: "You need to be logged in to track your orders. Please sign in to your account first."
                }
              ],
              error: "Authentication required",
              isLoading: false
            });
          } else {
            set({
              error: "Failed to track order. Please try again.",
              isLoading: false
            });
          }
        }
      },

      clearChat: () => {
        set({ messages: [], error: null });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: "chat-storage", // Name for localStorage
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    }
  )
);