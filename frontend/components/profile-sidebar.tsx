"use client"

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  Bell,
  CreditCard,
  HelpCircle,
  Gift,
  Clock,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useEffect, useState } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useTranslation } from 'react-i18next'
import '@/i18n'

const navigation = [
  {
    name: 'Dashboard',
    href: '/profile/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Orders',
    href: '/profile/orders',
    icon: ShoppingBag,
    badge: null
  },
  {
    name: 'Points & Rewards',
    href: '/profile/points',
    icon: Gift,
    badge: null
  },
  {
    name: 'Messages',
    href: '/profile/messages',
    icon: MessageSquare,
    badge: null
  },
  {
    name: 'Wishlist',
    href: '/profile/wishlist',
    icon: Heart,
    badge: null
  },
  {
    name: 'Security',
    href: '/profile/security',
    icon: Shield,
    badge: null
  },
  {
    name: 'Help & Support',
    href: '/profile/support',
    icon: HelpCircle,
    badge: null
  },
  {
    name: 'Settings',
    href: '/profile/settings',
    icon: Settings,
    badge: null
  },
]

export function ProfileSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { t } = useTranslation(['common'])
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Format the name from nom and prenom
  const fullName = user ? `${user.prenom} ${user.nom}` : ''
  const initials = user ? `${user.prenom?.[0]}${user.nom?.[0]}` : ''

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

  // Shared sidebar content component
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("bg-card rounded-xl border shadow-sm", mobile ? "h-full" : "")}>
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1"> {/* Added to contain text overflow */}
            <h3 className="font-semibold truncate">{fullName}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user?.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {mobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <VisuallyHidden>Close menu</VisuallyHidden>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{user?.soldePoints || 0}</p>
            <p className="text-xs text-muted-foreground">Points</p>
            <p className="text-xs text-muted-foreground">
              ≈ ${((user?.soldePoints || 0) * 0.01).toFixed(2)} value
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{user?.ordersCount || 0}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-xs text-muted-foreground">
              Track your orders
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className={mobile ? "h-[calc(100vh-15rem)]" : "h-[calc(100vh-20rem)]"}>
        <div className="p-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'hover:bg-muted'
              )}
              onClick={() => mobile && setIsOpen(false)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <Badge variant={pathname === item.href ? "outline" : "secondary"}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
          onClick={() => {
            logout();
            router.push('/auth/signin');
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </Button>
      </div>
    </div>
  )

  // Mobile sidebar trigger button (only visible on mobile)
  const MobileTrigger = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-20 right-5 z-50 rounded-full shadow-lg lg:hidden flex items-center justify-center h-12 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90 border-2 border-white/20 transition-all duration-300 hover:scale-105"
          aria-label="Open Profile Menu"
        >
          <User className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[85vw] max-w-[350px]">
        <SidebarContent mobile />
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block w-64 shrink-0 sticky top-20 self-start">
        <SidebarContent />
      </div>
      
      {/* Mobile sidebar trigger */}
      <MobileTrigger />
    </>
  )
}