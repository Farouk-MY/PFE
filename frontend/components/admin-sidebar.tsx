"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  BarChart,
  MessageSquare,
  FileText,
  Tags,
  Box,
  Truck,
  Shield,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  BrainCircuit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAdminAuthStore } from '@/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useTranslation } from 'react-i18next'
import '@/i18n'

// Define navigation with translation keys
const navigation = [
  {
    name: 'dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'orders',
    href: '/admin/orders',
    icon: ShoppingBag
  },
  {
    name: 'products',
    href: '/admin/products',
    icon: Box
  },
  {
    name: 'categories',
    href: '/admin/categories',
    icon: Tags
  },
  {
    name: 'customers',
    href: '/admin/customers',
    icon: Users
  },
  {
    name: 'messages',
    href: '/admin/messages',
    icon: MessageSquare
  },
  {
    name: 'aiData',
    href: '/admin/data',
    icon: BrainCircuit
  },
  {
    name: 'reports',
    href: '/admin/reports',
    icon: FileText
  },
  {
    name: 'settings',
    href: '/admin/settings',
    icon: Settings
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { admin, profile, logout, fetchAdminProfile } = useAdminAuthStore()
  const { setTheme, theme } = useTheme()
  const { t, i18n } = useTranslation(['common', 'admin'])
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Format initials for avatar
  const initials = admin ? `${admin.prenom?.[0] || ''}${admin.nom?.[0] || ''}` : ''

  // Check if we're on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Auto-close sidebar when navigating on mobile
  useEffect(() => {
    if (!isDesktop) {
      setIsOpen(false)
    }
  }, [pathname, isDesktop])

  // Fetch admin profile on component mount
  useEffect(() => {
    if (!admin) {
      fetchAdminProfile()
    }
  }, [admin, fetchAdminProfile])

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Safe access to notification and message counts
  const notificationCount = profile?.notifications || 0
  const pendingMessageCount = profile?.pendingMessages || 0

  // Desktop sidebar component
  const DesktopSidebar = () => (
      <div className="hidden lg:flex lg:w-64 h-screen bg-card border-r flex-col sticky top-0 z-30">
        <SidebarContent />
      </div>
  )

  // Mobile sidebar component
  const MobileSidebar = () => (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-6 w-6" />
            <VisuallyHidden>Open menu</VisuallyHidden>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu for admin dashboard
          </SheetDescription>
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>
  )

  // Shared sidebar content
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
      <>
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold">{t('admin:adminPanel')}</h3>
              <p className="text-xs text-muted-foreground">{t('admin:manageStore')}</p>
            </div>
            {mobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <VisuallyHidden>Close menu</VisuallyHidden>
                </Button>
            )}
          </div>

          {/* Admin Profile Section */}
          {admin && (
              <div className="flex items-center gap-3 py-3 border-t">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="font-medium text-sm truncate">{admin.prenom} {admin.nom}</p>
                  <p className="text-xs text-muted-foreground truncate">{admin.role}</p>
                </div>
              </div>
          )}

          {/* Theme Toggle Button */}
          <div className="flex items-center justify-between mt-3 p-2 bg-muted/40 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs">{t('admin:theme')}</span>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleTheme}
                aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>

          {/* Language Switch */}
          <div className="flex items-center justify-between mt-3 p-2 bg-muted/40 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs">{t('common:language')}</span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium"
                onClick={() => {
                  const currentLang = i18n.language;
                  const newLang = currentLang === 'fr' ? 'en' : 'fr';
                  i18n.changeLanguage(newLang);
                }}
                aria-label="Toggle language"
            >
              {i18n.language === 'fr' ? t('common:switchToEnglish') : t('common:switchToFrench')}
            </Button>
          </div>

          {/* Notifications Badge */}
          {notificationCount > 0 && (
              <div className="flex items-center justify-between mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">{t('admin:notifications')}</span>
                </div>
                <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {notificationCount}
                </div>
              </div>
          )}

          {/* Messages Badge */}
          {pendingMessageCount > 0 && (
              <div className="flex items-center justify-between mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-600 dark:text-purple-400">{t('admin:messages')}</span>
                </div>
                <div className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingMessageCount}
                </div>
              </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        pathname === item.href
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'hover:bg-muted'
                    )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(`admin:${item.name}`)}

                  {item.name === 'messages' && pendingMessageCount > 0 && (
                      <div className="ml-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingMessageCount}
                      </div>
                  )}
                </Link>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
              onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t('admin:logout')}
          </Button>
        </div>
      </>
  )

  return (
      <>
        <DesktopSidebar />
        <MobileSidebar />
      </>
  )
}