"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  User,
  Sun,
  Moon,
  Heart,
  Bell,
  X,
  ChevronRight,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Search } from "@/components/search";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/language-provider';
import '@/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import {useRouter} from "next/navigation";

// Define types for the category items
interface CategoryItem {
  title: string;
  href: string;
  description?: string;
}

// Define types for categories
interface Category {
  title: string;
  description?: string;
  items: CategoryItem[];
}

// Define user type
interface User {
  name?: string;
  email?: string;
  avatar?: string;
  orders?: {
    total: number;
    pending: number;
  };
  points?: number;
  unreadMessages?: number;
}

// Define props for the OverlayMenu component
interface OverlayMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: User | null;
  logout: () => void;
  categories: Category[];
  cartItemsCount: number;
}

const OverlayMenu: React.FC<OverlayMenuProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  logout,
  categories,
  cartItemsCount,
}) => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation(['header']);
  const { language, changeLanguage } = useLanguage();

  // If the menu is not open, don't render anything
  if (!isOpen) return null;
  const router = useRouter();


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Close only if the background is clicked, not the menu content
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-0 max-h-[85vh] overflow-auto rounded-b-xl bg-background/95 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-border/30 p-4">
              <h2 className="text-lg font-medium">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Menu Content */}
            <div className="space-y-6 p-4">
              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      asChild
                      className="h-auto justify-start py-3"
                    >
                      <Link
                        href="/profile"
                        onClick={onClose}
                        className="flex flex-col items-start"
                      >
                        <span className="text-sm font-normal text-muted-foreground">
                          My Account
                        </span>
                        <span className="font-medium">
                          {user?.name || "User"}
                        </span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="h-auto justify-start py-3"
                    >
                      <Link
                        href="/orders"
                        onClick={onClose}
                        className="flex flex-col items-start"
                      >
                        <span className="text-sm font-normal text-muted-foreground">
                          My Orders
                        </span>
                        <span className="font-medium">
                          {user?.orders?.total || 0} Orders
                        </span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                    >
                      <Link href="/auth/signin" onClick={onClose}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/auth/signup" onClick={onClose}>
                        Create Account
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Main Navigation */}
              <div className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  onClick={onClose}
                >
                  <span className="font-medium">Home</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/store"
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  onClick={onClose}
                >
                  <span className="font-medium">Store</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/about"
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  onClick={onClose}
                >
                  <span className="font-medium">About Us</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  onClick={onClose}
                >
                  <span className="font-medium">Contact Us</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </div>

              {/* Categories Accordion */}
              <div className="space-y-1">
                <h3 className="px-1 pb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Categories
                </h3>
                {categories.map((category, index) => (
                  <Accordion type="single" collapsible key={category.title}>
                    <AccordionItem
                      value={`category-${index}`}
                      className="border-0"
                    >
                      <AccordionTrigger className="rounded-lg p-3 transition-colors hover:bg-muted">
                        {category.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pl-3">
                          {category.items.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                              onClick={onClose}
                            >
                              <span>{item.title}</span>
                              <ChevronRight className="size-4 text-muted-foreground" />
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <h3 className="px-1 pb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Language
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    onClick={() => changeLanguage('en')}
                    className="h-auto justify-start py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-4 rounded-sm overflow-hidden border border-border">
                        <img src="/flags/england.svg" alt="English" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">English</span>
                        <span className="text-xs text-muted-foreground">EN</span>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant={language === 'fr' ? 'default' : 'outline'}
                    onClick={() => changeLanguage('fr')}
                    className="h-auto justify-start py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-4 rounded-sm overflow-hidden border border-border">
                        <img src="/flags/france.svg" alt="French" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Français</span>
                        <span className="text-xs text-muted-foreground">FR</span>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Quick actions buttons */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-14 w-full"
                >
                  {theme === "dark" ? (
                    <Sun className="size-5" />
                  ) : (
                    <Moon className="size-5" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="relative h-14 w-full"
                >
                  <Link href="/wishlist" onClick={onClose}>
                    <Heart className="size-5" />
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      2
                    </span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="relative h-14 w-full"
                >
                  <Link href="/notifications" onClick={onClose}>
                    <Bell className="size-5" />
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      3
                    </span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="relative h-14 w-full"
                >
                  <Link href="/cart" onClick={onClose}>
                    <ShoppingCart className="size-5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </div>

              {/* Bottom action */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                  onClick={() => {
                    logout();
                    onClose();
                    router.push('/auth/signin');
                  }}
                >
                  Sign Out
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OverlayMenu;
