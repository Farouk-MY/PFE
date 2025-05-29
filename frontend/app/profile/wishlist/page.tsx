"use client"

import { useState, useEffect } from 'react'
import { useUserStore } from '@/lib/store'
import { useClientControllerStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { Heart, Trash2, ShoppingCart, Share2, Star, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCartStore } from '@/store'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/language-provider';
import '@/i18n';

export default function WishlistPage() {
    const { user } = useUserStore()
    const { t } = useTranslation(['wishlist']);
    const { language } = useLanguage();

    const {
        favorites,
        fetchFavorites,
        removeFromFavoritesByProductId,
        isFavoriteLoading,
        error
    } = useClientControllerStore()
    const { addItem } = useCartStore()
    const [loading, setLoading] = useState(true)
    const [isSharing, setIsSharing] = useState(false)

    useEffect(() => {
        if (user) {
            fetchFavorites().finally(() => setLoading(false))
        }
    }, [user, fetchFavorites])

    const removeFromWishlist = async (productId: number) => {
        await removeFromFavoritesByProductId(productId)
    }

    const addToCart = (product: any) => {
        addItem({
            id: product.id.toString(),
            name: product.designation,
            price: product.prix,
            quantity: 1,
            image: product.images?.[0],
            points: product.nbrPoint
        })
        toast.success(t('addToCart'))
    }

    const shareProduct = async (product: any) => {
        setIsSharing(true)
        try {
            const productUrl = `${window.location.origin}/store/product/${product.id}`
            const shareData = {
                title: product.designation,
                text: `Check out this product: ${product.designation}`,
                url: productUrl
            }

            if (navigator.share) {
                await navigator.share(shareData)
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(productUrl)
                toast.success(t('productLinkCopied', 'Product link copied to clipboard!'))
            } else {
                const input = document.createElement('input')
                input.value = productUrl
                document.body.appendChild(input)
                input.select()
                document.execCommand('copy')
                document.body.removeChild(input)
                toast.success(t('productLinkCopied', 'Product link copied to clipboard!'))
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                toast.error(t('shareError', 'Failed to share product'))
                console.error('Share failed:', err)
            }
        } finally {
            setIsSharing(false)
        }
    }

    // Calculate average rating for a product
    const calculateAverageRating = (reviews: any[]) => {
        if (!reviews || reviews.length === 0) return 0
        const sum = reviews.reduce((acc, review) => acc + review.note, 0)
        return sum / reviews.length
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <ProfileSidebar />
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                                    <p className="text-muted-foreground mt-1">{t('loading')}</p>
                                </div>
                            </div>
                            <Card className="p-12 text-center">
                                <div className="animate-pulse">
                                    <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50"></div>
                                    <div className="h-8 w-1/2 mx-auto bg-muted/50 rounded mb-4"></div>
                                    <div className="h-4 w-3/4 mx-auto bg-muted/50 rounded"></div>
                                </div>
                            </Card>
                        </div>
                    </div>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">{t('title')}</h1>
                                <p className="text-muted-foreground mt-1">
                                    {t('itemsCount', { count: favorites.length })}
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/store">
                                    {t('continueShopping')}
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {error && (
                            <Card className="p-6 text-red-500">
                                {error}
                            </Card>
                        )}

                        {favorites.length > 0 ? (
                            <div className="space-y-6">
                                {favorites.map((favorite, index) => {
                                    const avgRating = calculateAverageRating(favorite.produit.avis || [])
                                    const reviewCount = favorite.produit.avis?.length || 0

                                    return (
                                        <motion.div
                                            key={favorite.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <Card className="p-6">
                                                <div className="flex gap-6">
                                                    <div className="w-40 h-40 overflow-hidden rounded-xl bg-black/5 backdrop-blur-xl">
                                                        <img
                                                            src={favorite.produit.images?.[0] || "https://via.placeholder.com/150"}
                                                            alt={favorite.produit.designation}
                                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <h3 className="text-xl font-semibold mb-2">{favorite.produit.designation}</h3>
                                                                <Badge variant="secondary" className="mb-2">
                                                                    {favorite.produit.category?.name || t('uncategorized')}
                                                                </Badge>
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <div className="flex items-center">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <Star
                                                                                key={star}
                                                                                className={`h-4 w-4 ${
                                                                                    star <= Math.round(avgRating)
                                                                                        ? "fill-yellow-500 text-yellow-500"
                                                                                        : "text-gray-300"
                                                                                }`}
                                                                            />
                                                                        ))}
                                                                        <span className="ml-2 text-sm">{avgRating.toFixed(1)}</span>
                                                                    </div>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        ({reviewCount} {reviewCount === 1 ? t('review') : t('reviews')})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-2xl font-bold">${favorite.produit.prix.toFixed(2)}</p>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Heart className="h-4 w-4" />
                                                                {t('addedOn', { date: new Date(favorite.addedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') })}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => shareProduct(favorite.produit)}
                                                                    disabled={isSharing}
                                                                >
                                                                    <Share2 className="h-4 w-4 mr-2" />
                                                                    {isSharing ? t('sharing') : t('share')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-600"
                                                                    onClick={() => removeFromWishlist(favorite.produit.id)}
                                                                    disabled={isFavoriteLoading}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    {t('remove')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                                                                    onClick={() => addToCart(favorite.produit)}
                                                                >
                                                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                                                    {t('addToCart')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <Card className="p-12 text-center">
                                <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                    <Heart className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">{t('emptyWishlist')}</h2>
                                <p className="text-muted-foreground mb-6">
                                    {t('startAdding')}
                                </p>
                                <Button asChild>
                                    <Link href="/store">
                                        {t('wishlist:exploreStore')}
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}