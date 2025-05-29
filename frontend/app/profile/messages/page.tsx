"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { MessageSquare, Send } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useMessagerieStore } from '@/store'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function MessagesPage() {
  // Initialize i18n translation
  const { t } = useTranslation(['messages'])
  const { language } = useLanguage()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    initializeSocket,
    disconnectSocket,
    fetchConversations,
    fetchMessages,
    sendMessage,
    isConnected: socketConnected,
  } = useMessagerieStore();

  const { user } = useAuthStore();

  useEffect(() => {
    initializeSocket();
    fetchConversations();

    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket, fetchConversations]);

  useEffect(() => {
    if (conversations.length > 0) {
      fetchMessages();
    }
  }, [conversations, fetchMessages]);

  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="hidden lg:block">
              <ProfileSidebar />
            </div>

            <div className="flex-1">
              <Card className="h-[calc(123vh-12rem)] overflow-hidden">
                <div className="relative h-full flex flex-col">
                  {/* Connection status indicator */}
                  <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 text-xs ${
                      isConnected ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {isConnected ? t('connected') : t('disconnected')}
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>ST</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{t('supportTeam')}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.utilisateur.role === 'admin'
                                        ? 'justify-start'
                                        : 'justify-end'
                                }`}
                            >
                              {message.utilisateur.role === 'admin' && (
                                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0 self-end mb-1">
                                    <AvatarFallback>ST</AvatarFallback>
                                  </Avatar>
                              )}

                              <div
                                  className={`
                              max-w-[80%] sm:max-w-[70%] p-3 rounded-lg
                              ${message.utilisateur.role === 'admin'
                                      ? 'bg-muted rounded-bl-none'
                                      : 'bg-primary text-primary-foreground rounded-br-none'}
                            `}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">
                                  {formatTime(message.date_envoi)}
                                </p>
                              </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Textarea
                              placeholder={t('typeMessage')}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="min-h-[60px] max-h-[120px] resize-none"
                              rows={2}
                          />
                        </div>
                        <Button
                            className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center"
                            onClick={handleSendMessage}
                            title={t('sendMessage')}
                            disabled={!isConnected}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}