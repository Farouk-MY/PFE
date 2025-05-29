"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useClientControllerStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { 
  Gift, 
  ArrowRight, 
  ShoppingBag, 
  ChevronRight,
  ChevronLeft,
  Trophy
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function PointsPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['points', 'common'])
    const { language } = useLanguage()
    
    const router = useRouter()
    const {
        isAuthenticated,
        user
    } = useAuthStore()

    // Get points history from clientController store
    const {
        pointsHistory,
        fetchPointsHistory,
        isLoading
    } = useClientControllerStore()

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    
    // Fetch points history when the component mounts
    useEffect(() => {
        if (isAuthenticated) {
            fetchPointsHistory()
        } else {
            router.push('/auth/signin') // Redirect to login if not authenticated
        }
    }, [isAuthenticated, fetchPointsHistory, router])

    // Calculate total points earned this month
    const calculatePointsThisMonth = () => {
        if (!pointsHistory?.historique) return 0

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        return pointsHistory.historique
            .filter(item => new Date(item.date) >= startOfMonth && item.pointsGagnes > 0)
            .reduce((sum, item) => sum + (item.pointsGagnes || 0), 0)
    }

    // Calculate total points redeemed this month
    const calculatePointsRedeemedThisMonth = () => {
        if (!pointsHistory?.historique) return 0

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        return Math.abs(pointsHistory.historique
            .filter(item => new Date(item.date) >= startOfMonth && item.pointsUtilises > 0)
            .reduce((sum, item) => sum + (item.pointsUtilises || 0), 0))
    }

    // Format the points history items for display
    const formatHistoryItems = () => {
        if (!pointsHistory?.historique) return []

        return pointsHistory.historique.map(item => ({
            id: item.commandeId,
            type: item.pointsGagnes > 0 ? 'earned' : 'redeemed',
            points: item.impact,
            description: `${t('order')} #${item.commandeId}: ${item.pointsGagnes > 0 ? t('earned') : t('redeemed')}`,
            date: item.date
        }))
    }

    // Get current points balance either from pointsHistory or user object
    const currentPointsBalance = pointsHistory?.soldeActuel || user?.soldePoints || 0

    // Paginate the history items
    const paginateItems = (items: Array<any>) => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return items.slice(startIndex, startIndex + itemsPerPage)
    }
    
    const historyItems = formatHistoryItems()
    const totalPages = Math.ceil(historyItems.length / itemsPerPage)
    const paginatedItems = paginateItems(historyItems)

    // Navigation handlers
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    // Format date based on current language
    const formatDateByLanguage = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Handle loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-600 animate-spin mx-auto mb-4"></div>
                    <p className="font-medium text-lg">{t('loading', { ns: 'common' })}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <ProfileSidebar />

                    <div className="flex-1 space-y-8">
                        {/* Hero Section - Enhanced design */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="relative overflow-hidden rounded-xl"
                        >
                            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-8 md:p-10 rounded-xl shadow-lg">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                <div className="absolute left-10 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-xl translate-y-1/3"></div>
                                <div className="absolute right-20 bottom-10 w-32 h-32 bg-purple-500/20 rounded-full blur-lg"></div>

                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                                <Trophy className="h-6 w-6 text-white" />
                                            </div>
                                            <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-3 py-1 text-sm">
                                                {t('availablePoints')}
                                            </Badge>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 flex items-end gap-2">
                                            {currentPointsBalance} <span className="text-xl md:text-2xl text-white/80">{t('points')}</span>
                                        </h2>
                                        <p className="text-white/80 text-lg">
                                            {t('pointsWorth', { value: `${(currentPointsBalance * 0.01).toFixed(2)}` })}
                                        </p>
                                    </div>

                                    <Button className="bg-white text-blue-700 hover:bg-white/90 shadow-lg px-6 py-6 rounded-xl text-lg font-medium">
                                        {t('redeemPoints')}
                                        <Gift className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Cards - Improved design */}
                        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-blue-600/10 dark:bg-blue-600/30 rounded-lg">
                                    <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium">
                                    {t('thisMonth')}
                                </Badge>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{calculatePointsThisMonth()}</h3>
                            <p className="text-sm text-muted-foreground">{t('pointsEarned')}</p>
                        </Card>

                        {/* Points History - Enhanced with pagination */}
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/70 dark:to-blue-900/30 p-6 border-b dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">{t('pointsHistoryTitle')}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('pointsHistorySubtitle')}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                        {t('viewAll')}
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                {historyItems.length > 0 ? (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            {paginatedItems.map((item: any, index: number) => (
                                                <motion.div
                                                    key={`${item.id}-${index}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="flex items-center justify-between p-5 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-lg ${
                                                            item.type === 'earned' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' :
                                                                'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                                                        }`}>
                                                            {item.type === 'earned' ?
                                                                <ShoppingBag className="h-6 w-6" /> :
                                                                <Gift className="h-6 w-6" />
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-base">{item.description}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDateByLanguage(item.date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`font-semibold text-lg ${
                                                        item.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {item.points > 0 ? '+' : ''}{item.points} {t('points')}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        
                                        {/* Pagination controls */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-sm text-muted-foreground">
                                                {t('showing')} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, historyItems.length)} {t('of')} {historyItems.length}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={goToPrevPage} 
                                                    disabled={currentPage === 1}
                                                    className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    {t('previous')}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={goToNextPage} 
                                                    disabled={currentPage === totalPages}
                                                    className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    {t('next')}
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="p-5 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
                                            <Gift className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-medium mb-2">{t('noPointsHistory')}</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-5">
                                            {t('makeAPurchase')}
                                        </p>
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 shadow-md">
                                            {t('shopNow')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* How Points Work section - enhanced and simplified */}
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/70 dark:to-blue-900/30 p-6 border-b dark:border-gray-800">
                                <h2 className="text-xl font-semibold">{t('howPointsWorkTitle')}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('howItWorksDescription')}
                                </p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/10 rounded-xl transition-all hover:shadow-md border border-blue-100/50 dark:border-blue-800/30">
                                        <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 w-fit rounded-xl mb-4 border border-blue-200/50 dark:border-blue-700/50">
                                            <ShoppingBag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">{t('earnPointsTitle')}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                            {t('earnPointsDescription')}
                                        </p>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-gray-700 dark:text-gray-200">{t('regularPurchases')}</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-gray-700 dark:text-gray-200">{t('specialEvents')}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/10 rounded-xl transition-all hover:shadow-md border border-purple-100/50 dark:border-purple-800/30">
                                        <div className="p-4 bg-purple-500/10 dark:bg-purple-500/20 w-fit rounded-xl mb-4 border border-purple-200/50 dark:border-purple-700/50">
                                            <Gift className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-3 text-purple-700 dark:text-purple-300">{t('redeemPointsTitle')}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                            {t('redeemPointsDescription')}
                                        </p>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                <span className="text-gray-700 dark:text-gray-200">{t('minimumRedemption')}</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                <span className="text-gray-700 dark:text-gray-200">{t('pointsNeverExpire')}</span>
                                            </li>
                                        </ul>
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