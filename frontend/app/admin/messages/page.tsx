"use client"

import {useEffect, useState} from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {Search, Mail, Phone, MoreVertical, Clock, ShoppingCart, MessageSquare, ChevronLeft, Send} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMessagerieStore,useAdminAuthStore } from '@/store'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function AdminMessagesPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['messages', 'common'])
    const { language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [showSidebar, setShowSidebar] = useState(true)

    const {
        conversations,
        currentConversation,
        messages,
        unreadCount,
        isLoading,
        error,
        initializeSocket,
        disconnectSocket,
        fetchConversations,
        fetchMessages,
        sendMessage,
        setCurrentConversation,
    } = useMessagerieStore();

    const { admin } = useAdminAuthStore();

    useEffect(() => {
        initializeSocket();
        fetchConversations();

        return () => {
            disconnectSocket();
        };
    }, [initializeSocket, disconnectSocket, fetchConversations]);

    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation.user.id);
        }
    }, [currentConversation, fetchMessages]);

    const filteredConversations = conversations.filter(conversation =>
        conversation.user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await sendMessage(newMessage, currentConversation?.lastMessage?.id);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <div className="lg:hidden p-4 border-b bg-card flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="lg:hidden"
                    >
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">{t('messages:title')}</h1>
                    <div className="w-9"></div> {/* Spacer */}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Conversations sidebar */}
                    <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-80 xl:w-96 border-r bg-card`}>
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('messages:searchCustomers')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <ScrollArea className="h-[calc(100vh-140px)] lg:h-[calc(100vh-64px)]">
                            <div className="divide-y">
                                {filteredConversations.map((conversation) => (
                                    <motion.div
                                        key={conversation.user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`p-3 cursor-pointer transition-colors ${
                                            currentConversation?.user.id === conversation.user.id
                                                ? 'bg-primary/10 dark:bg-primary/20'
                                                : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => {
                                            setCurrentConversation(conversation);
                                            if (window.innerWidth < 1024) {
                                                setShowSidebar(false);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="relative">
                                                <Avatar className="border-2 border-background">
                                                    <AvatarFallback>
                                                        {conversation.user.nom[0]}{conversation.user.prenom[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium truncate">
                                                        {conversation.user.nom} {conversation.user.prenom}
                                                    </h4>
                                                    {conversation.unread && (
                                                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conversation.lastMessage.contenu}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {new Date(conversation.lastMessage.date_envoi).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main chat area */}
                    <div className="flex-1 flex flex-col bg-background overflow-hidden">
                        {currentConversation ? (
                            <>
                                {/* Chat header */}
                                <div className="p-3 border-b bg-card flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="lg:hidden"
                                            onClick={() => setShowSidebar(true)}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>
                                                {currentConversation.user.nom[0]}{currentConversation.user.prenom[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-medium">
                                                {currentConversation.user.nom} {currentConversation.user.prenom}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-green-500 flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    {t('messages:online')}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>{t('messages:viewProfile')}</DropdownMenuItem>
                                                <DropdownMenuItem>{t('messages:markAsResolved')}</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">{t('messages:blockUser')}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Messages */}
                                <ScrollArea className="flex-1 p-4 bg-muted/10">
                                    <div className="space-y-3">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${
                                                    message.utilisateur.role === 'admin'
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                }`}
                                            >
                                                <div className={`max-w-[80%] rounded-lg p-3 ${
                                                    message.utilisateur.role === 'admin'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-card border'
                                                }`}>
                                                    <p className="text-sm">{message.contenu}</p>
                                                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                                                        message.utilisateur.role === 'admin'
                                                            ? 'text-primary-foreground/80'
                                                            : 'text-muted-foreground'
                                                    }`}>
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(message.date_envoi).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Message input */}
                                <div className="p-3 border-t bg-card">
                                    <div className="flex items-end gap-2">
                                        <Textarea
                                            placeholder={t('messages:typeMessage')}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="min-h-[40px] flex-1 resize-none"
                                            rows={1}
                                        />
                                        <Button
                                            size="icon"
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className="shrink-0 h-10 w-10"
                                        >
                                            <Send className="h-4 w-4" aria-label={t('messages:sendMessage')} />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-muted p-6 rounded-full mb-4">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">{t('messages:noConversationSelected')}</h3>
                                <p className="text-muted-foreground max-w-md">
                                    {t('messages:selectCustomer')}
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4 lg:hidden"
                                    onClick={() => setShowSidebar(true)}
                                >
                                    {t('messages:browseConversations')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}