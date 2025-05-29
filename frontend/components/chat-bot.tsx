"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User as UserIcon,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store"; // Import auth store to check if user is logged in

export function Chatbot() {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get chat store methods and state
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    trackOrder,
    clearChat,
    clearError
  } = useChatStore();

  // Get auth state to determine if user is logged in - using selector with stable reference
  const isAuthenticated = useAuthStore(state => !!state.token);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim();
    setInput("");

    // Check if the message is an order tracking request
    const orderTrackingRegex = /track\s+(?:my\s+)?order\s*(?:number|#)?\s*[#]?(\w+)/i;
    const orderMatch = trimmedInput.match(orderTrackingRegex);

    if (orderMatch && orderMatch[1]) {
      // This is an order tracking request
      await trackOrder(orderMatch[1]);
    } else {
      // This is a general question
      await sendMessage(trimmedInput);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;

    // Check if the suggestion is about order tracking
    const orderTrackingRegex = /track\s+(?:my\s+)?order\s*(?:number|#)?\s*[#]?(\w+)/i;
    const orderMatch = suggestion.match(orderTrackingRegex);

    if (orderMatch && orderMatch[1]) {
      // This is an order tracking request
      await trackOrder(orderMatch[1]);
    } else {
      // This is a general question
      await sendMessage(suggestion);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Chat button when closed
  if (!isOpen) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-4 right-4 z-50"
        >
          <Button
              onClick={toggleChat}
              className="group relative size-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:opacity-90"
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-10" />
            <MessageCircle className="size-6 text-white" />
          </Button>
        </motion.div>
    );
  }

  // Suggestion examples based on authentication status
  const defaultSuggestions = [
    "What gaming laptops do you recommend?",
    "Do you have mechanical keyboards in stock?",
    "Compare RTX 4070 vs RTX 4080"
  ];

  const authenticatedSuggestions = [
    ...defaultSuggestions,
    "Track my order #ORD123456"
  ];

  const suggestions = isAuthenticated ? authenticatedSuggestions : defaultSuggestions;

  return (
      <Card className="fixed bottom-4 right-4 w-80 overflow-hidden rounded-2xl border-0 bg-white/80 shadow-lg backdrop-blur-xl dark:bg-gray-900/80 sm:w-96 z-50">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="flex items-center gap-2 text-white">
              <Bot className="size-5" />
              <h2 className="font-semibold">TechVerse Assistant</h2>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Scrollable chat area */}
          <div className="h-[400px] overflow-y-auto p-4" ref={scrollRef}>
            <div className="space-y-4">
              {/* Welcome message when no messages exist */}
              {messages.length === 0 ? (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Sparkles className="size-8 text-white" />
                    </div>
                    <p className="mb-2 text-lg font-medium">
                      Welcome to TechVerse Assistant
                    </p>
                    <p className="mb-6 text-muted-foreground">
                      How can I assist you today?
                    </p>
                    <div className="grid gap-2">
                      {suggestions.map((suggestion) => (
                          <Button
                              key={suggestion}
                              variant="outline"
                              className="group w-full justify-between hover:border-primary/50"
                              onClick={() => handleSuggestionClick(suggestion)}
                              disabled={isLoading}
                          >
                            {suggestion}
                            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                      ))}
                    </div>
                  </div>
              ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                          <div
                              className={`flex ${
                                  message.role === "user" ? "justify-end" : "justify-start"
                              } mb-4`}
                          >
                            {message.role === "assistant" && (
                                <div className="mr-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                                  <Bot className="size-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[80%]`}>
                              <div
                                  className={`rounded-2xl px-4 py-2 ${
                                      message.role === "user"
                                          ? "ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                          : "bg-gray-100 dark:bg-gray-800"
                                  }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                            {message.role === "user" && (
                                <div className="ml-2 flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                  <UserIcon className="size-4 text-muted-foreground" />
                                </div>
                            )}
                          </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
              )}

              {/* Loading indicator */}
              {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="mr-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div className="max-w-[80%]">
                      <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                        <Loader2 className="size-5 animate-spin text-gray-500" />
                      </div>
                    </div>
                  </div>
              )}

              {/* Error message */}
              {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-300 text-sm">
                    {error}
                  </div>
              )}
            </div>
          </div>

          {/* Input form */}
          <form
              onSubmit={handleSubmit}
              className="border-t bg-white/50 p-4 backdrop-blur-sm dark:bg-gray-900/50"
          >
            <div className="flex items-center gap-2">
              <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isAuthenticated
                      ? "Ask about products, orders, or support..."
                      : "Ask about products, specs, or support..."}
                  className="flex-1 border-0 bg-gray-100 focus-visible:ring-1 focus-visible:ring-primary dark:bg-gray-800"
                  disabled={isLoading}
              />
              <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                  disabled={isLoading || !input.trim()}
              >
                <Send className="size-4 text-white" />
              </Button>
            </div>

            {/* Clear chat button */}
            {messages.length > 0 && (
                <div className="mt-2 flex justify-end">
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="text-xs text-muted-foreground"
                      disabled={isLoading}
                  >
                    Clear conversation
                  </Button>
                </div>
            )}
          </form>
        </motion.div>
      </Card>
  );
}