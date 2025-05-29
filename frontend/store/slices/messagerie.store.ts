import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useAdminAuthStore } from './adminAuth';

interface Message {
    id: number;
    contenu: string;
    date_envoi: string;
    lu: boolean;
    utilisateur_id: number;
    parent_message_id: number | null;
    utilisateur: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        role: string;
    };
}

interface MessagerieState {
    socket: Socket | null;
    conversations: any[];
    currentConversation: any | null;
    messages: Message[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    initializeSocket: () => void;
    disconnectSocket: () => void;
    sendMessage: (content: string, parentMessageId?: number | null) => Promise<void>;
    fetchConversations: () => Promise<void>;
    fetchMessages: (userId?: number) => Promise<void>;
    markAsRead: (messageId: number) => Promise<void>;
    setCurrentConversation: (conversation: any) => void;
}

export const useMessagerieStore = create<MessagerieState>((set, get) => ({
    socket: null,
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    isConnected: false,
    isLoading: false,
    error: null,

    initializeSocket: () => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5077', {
            path: '/socket.io',
            withCredentials: true,
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
            set({ isConnected: true, socket });

            const user = useAuthStore.getState().user || useAdminAuthStore.getState().admin;
            if (user) {
                socket.emit('join_user_room', user.id.toString());
                console.log(`User ${user.id} joined their room`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            set({ isConnected: false });
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        // Handle new messages for admin
        socket.on('new_message_admin', (message: Message) => {
            const { currentConversation, messages } = get();
            if (currentConversation && currentConversation.user.id === message.utilisateur_id) {
                set({ messages: [...messages, message] });
            }
            set({ unreadCount: get().unreadCount + 1 });
        });

        // Handle new messages for client
        socket.on('new_message_client', (message: Message) => {
            console.log('Received new message for client:', message);
            const { messages } = get();
            set({ messages: [...messages, message] });
        });

        // Handle admin replies
        socket.on('new_admin_reply', (message: Message) => {
            const { currentConversation, messages } = get();
            if (currentConversation && currentConversation.user.id === message.utilisateur_id) {
                set({ messages: [...messages, message] });
            }
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    sendMessage: async (content, parentMessageId = null) => {
        try {
            const { currentConversation } = get();
            const isAdmin = useAdminAuthStore.getState().isAuthenticated;
            const userId = isAdmin
                ? useAdminAuthStore.getState().admin?.id
                : useAuthStore.getState().user?.id;

            if (!userId) throw new Error('User not authenticated');

            const endpoint = isAdmin
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/reply-message`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/send-message`;

            const response = await axios.post(endpoint, {
                contenu: content,
                utilisateur_id: isAdmin ? currentConversation?.user.id : userId,
                ...(isAdmin && parentMessageId && { message_id: parentMessageId }),
                ...(isAdmin && { admin_id: userId }),
            });

            if (response.data.success) {
                const newMessage = response.data.data;
                set(state => ({ messages: [...state.messages, newMessage] }));
            } else {
                throw new Error(response.data.error || 'Failed to send message');
            }
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to send message' });
            throw error;
        }
    },

    fetchConversations: async () => {
        try {
            set({ isLoading: true });
            const isAdmin = useAdminAuthStore.getState().isAuthenticated;
            const endpoint = isAdmin
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/all-messages`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/client-messages`

            const userId = useAuthStore.getState().user?.id;
            const url = isAdmin
                ? endpoint
                : `${endpoint}/${userId}`;

            const response = await axios.get(url);

            // Format conversations for admin and client differently
            if (isAdmin) {
                const messages = response.data.messages;
                const conversationsMap = new Map<number, any>();

                messages.forEach((msg: Message) => {
                    if (!msg.parent_message_id) { // Only parent messages
                        if (!conversationsMap.has(msg.utilisateur_id)) {
                            conversationsMap.set(msg.utilisateur_id, {
                                user: msg.utilisateur,
                                lastMessage: msg,
                                unread: !msg.lu,
                            });
                        }
                    }
                });

                set({ conversations: Array.from(conversationsMap.values()) });
            } else {
                // For client, just set the admin as the conversation
                const adminReplies = response.data.messages.filter((msg: Message) =>
                    msg.utilisateur.role === 'admin'
                );

                if (adminReplies.length > 0) {
                    set({
                        conversations: [{
                            user: adminReplies[0].utilisateur,
                            lastMessage: adminReplies[0],
                            unread: !adminReplies[0].lu,
                        }]
                    });
                }
            }
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to fetch conversations' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchMessages: async (userId) => {
        try {
            set({ isLoading: true });
            const isAdmin = useAdminAuthStore.getState().isAuthenticated;
            const currentUserId = useAuthStore.getState().user?.id || useAdminAuthStore.getState().admin?.id;

            let url = `${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/client-messages/`;
            if (isAdmin && userId) {
                url += userId;
            } else if (!isAdmin) {
                url += currentUserId;
            } else {
                throw new Error('Invalid request');
            }

            const response = await axios.get(url);

            if (response.data.success) {
                set({ messages: response.data.messages });
            } else {
                throw new Error(response.data.error || 'Failed to fetch messages');
            }
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to fetch messages' });
        } finally {
            set({ isLoading: false });
        }
    },

    markAsRead: async (messageId) => {
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/messagerie/messages/${messageId}/read`);
            set(state => ({
                messages: state.messages.map(msg =>
                    msg.id === messageId ? { ...msg, lu: true } : msg
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    },

    setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation });
        if (conversation?.lastMessage && !conversation.lastMessage.lu) {
            get().markAsRead(conversation.lastMessage.id);
        }
    },
}));

axios.defaults.withCredentials = true;
