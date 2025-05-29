"use client"

import { useState, useEffect } from 'react'
import { useClientControllerStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Filter, Search, X, ChevronDown, ShoppingBag, Heart, Bookmark, Tag, ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function StorePage() {
  // Access the client controller store
  const {
    isLoading,
    products,
    categories,
    fetchProducts,
    fetchCategories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    searchProducts,
    favorites,
    isFavoriteLoading,
    addToFavorites,
    removeFromFavoritesByProductId,
    fetchFavorites
  } = useClientControllerStore()

  const { token } = useAuthStore()
  
  // Initialize i18n translation
  const { t } = useTranslation(['store'])
  const { language } = useLanguage()

  // Local state for filters
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000],
    inStock: false,
    rating: 0,
    sort: 'featured',
  })

  // Load products, categories and favorites on mount
  useEffect(() => {
    fetchCategories()
    fetchProducts()
    if (token) {
      fetchFavorites()
    }
  }, [token])

  // Check if a product is in favorites
  const isFavorite = (productId: number) => {
    return favorites.some(fav => fav.produitId === productId)
  }

  // Toggle favorite status
  const toggleFavorite = async (productId: number) => {
    if (!token) {
      toast.warning(t('favorites.loginRequired'))
      return
    }

    try {
      if (isFavorite(productId)) {
        await removeFromFavoritesByProductId(productId)
        toast.success(t('favorites.removed'))
      } else {
        await addToFavorites(productId)
        toast.success(t('favorites.added'))
      }
      // Refresh favorites list
      await fetchFavorites()
    } catch (error) {
      toast.error(t('favorites.error'))
    }
  }

  // Apply filters to products from the store
  const filteredProducts = products.filter(product => {
    // Price range filter
    if (product.prix < filters.priceRange[0] || product.prix > filters.priceRange[1]) {
      return false
    }

    // In stock filter
    if (filters.inStock && product.qteStock === 0) {
      return false
    }

    // Rating filter
    if (filters.rating > 0 && (product.avgRating || 0) < filters.rating) {
      return false
    }

    return true
  })

  // Sort products based on sort selection
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.prix - b.prix
      case 'price-desc':
        return b.prix - a.prix
      case 'rating':
        return (b.avgRating || 0) - (a.avgRating || 0)
      case 'newest':
        return b.id - a.id
      default:
        return 0
    }
  })

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 1000000],
      inStock: false,
      rating: 0,
      sort: 'featured',
    })
    setSelectedCategory(null)
    setSearchQuery('')
  }

  const activeFilterCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0,
    filters.inStock ? 1 : 0,
    filters.rating > 0 ? 1 : 0,
    selectedCategory !== null ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 pt-32">
        {/* Category Pills - Improved for better contrast in dark mode */}
        <div className="container mx-auto px-4 mb-6">
          <div className="flex space-x-2 pb-2 overflow-x-auto scrollbar-hide">
            <Button
                variant={selectedCategory === null ? "default" : "outline"}
                className="rounded-full whitespace-nowrap shadow-sm hover:shadow-md transition-all dark:border-slate-700 dark:bg-opacity-90"
                onClick={() => setSelectedCategory(null)}
            >
              {t('categories.allCategories', 'All Categories')}
            </Button>
            {categories.map((category) => (
                <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="rounded-full whitespace-nowrap shadow-sm hover:shadow-md transition-all dark:border-slate-700 dark:bg-opacity-90"
                    onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                  {category._count?.produits && (
                      <Badge variant="outline" className="ml-2 bg-background/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        {category._count.produits}
                      </Badge>
                  )}
                </Button>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Desktop Filters Sidebar - Theme-aware styling */}
            <div className="hidden md:block w-64 space-y-6">
              <div className="bg-card dark:bg-slate-900/80 rounded-xl shadow-md border border-muted/30 dark:border-slate-700/50 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Filter className="mr-2 h-5 w-5 text-primary" />
                    {t('filters.title', 'Filters')}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                    {t('filters.clearAll', 'Clear All')}
                  </Button>
                </div>

                <Accordion type="single" collapsible defaultValue="price" className="w-full">
                  <AccordionItem value="price" className="border-b border-muted/50 dark:border-slate-700/50">
                    <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.price.title', 'Price Range')}</AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <Slider
                            min={0}
                            max={5000}
                            step={100}
                            value={filters.priceRange}
                            onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                            className="mb-6"
                        />
                        <div className="flex justify-between items-center">
                          <div className="bg-muted/50 dark:bg-slate-800 rounded-md px-3 py-1 font-medium">
                            {filters.priceRange[0]} TND
                          </div>
                          <div className="text-muted-foreground">{t('filters.price.to', 'to')}</div>
                          <div className="bg-muted/50 dark:bg-slate-800 rounded-md px-3 py-1 font-medium">
                            {filters.priceRange[1]} TND
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="rating" className="border-b border-muted/50 dark:border-slate-700/50">
                    <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.rating', 'Rating')}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                            <div
                                key={rating}
                                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                                    filters.rating === rating
                                        ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium'
                                        : 'hover:bg-muted/50 dark:hover:bg-slate-800/50'
                                }`}
                                onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? 0 : rating })}
                            >
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                            i < rating
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-muted-foreground'
                                        }`}
                                    />
                                ))}
                              </div>
                              <span className="text-sm">{t('filters.ratingUp', '& Up')}</span>
                            </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="availability" className="border-b-0">
                    <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.availability', 'Availability')}</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center space-x-2 py-2">
                        <Switch
                            id="stock"
                            checked={filters.inStock}
                            onCheckedChange={(checked) => setFilters({ ...filters, inStock: checked })}
                        />
                        <Label htmlFor="stock" className="cursor-pointer">{t('filters.inStock', 'In Stock Only')}</Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            {/* Mobile Filters - Theme-aware styling */}
            <div className="md:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between shadow-sm dark:border-slate-700">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-primary" />
                      {t('filters.title', 'Filters')}
                    </div>
                    {activeFilterCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center">
                      <Filter className="mr-2 h-5 w-5 text-primary" />
                      {t('filters.title', 'Filters')}
                    </SheetTitle>
                    <SheetDescription>
                      {t('filters.refineSearch', 'Refine your product search')}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mb-6 w-full dark:border-slate-700">
                      {t('filters.clearAll', 'Clear All Filters')}
                    </Button>

                    <Accordion type="single" collapsible defaultValue="price" className="w-full">
                      <AccordionItem value="price" className="border-b border-muted/50 dark:border-slate-700/50">
                        <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.price.title', 'Price Range')}</AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2">
                            <Slider
                                min={0}
                                max={5000}
                                step={100}
                                value={filters.priceRange}
                                onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                                className="mb-6"
                            />
                            <div className="flex justify-between items-center">
                              <div className="bg-muted/50 dark:bg-slate-800 rounded-md px-3 py-1 font-medium">
                                {filters.priceRange[0]} TND
                              </div>
                              <div className="text-muted-foreground">{t('filters.price.to', 'to')}</div>
                              <div className="bg-muted/50 dark:bg-slate-800 rounded-md px-3 py-1 font-medium">
                                {filters.priceRange[1]} TND
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="rating" className="border-b border-muted/50 dark:border-slate-700/50">
                        <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.rating', 'Rating')}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {[4, 3, 2, 1].map((rating) => (
                                <div
                                    key={rating}
                                    className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                                        filters.rating === rating
                                            ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium'
                                            : 'hover:bg-muted/50 dark:hover:bg-slate-800/50'
                                    }`}
                                    onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? 0 : rating })}
                                >
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < rating
                                                    ? 'text-yellow-500 fill-yellow-500'
                                                    : 'text-muted-foreground'
                                            }`}
                                        />
                                    ))}
                                  </div>
                                  <span className="text-sm">{t('filters.ratingUp', '& Up')}</span>
                                </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="availability" className="border-b-0">
                        <AccordionTrigger className="hover:text-primary transition-colors">{t('filters.availability', 'Availability')}</AccordionTrigger>
                        <AccordionContent>
                          <div className="flex items-center space-x-2 py-2">
                            <Switch
                                id="mobile-stock"
                                checked={filters.inStock}
                                onCheckedChange={(checked) => setFilters({ ...filters, inStock: checked })}
                            />
                            <Label htmlFor="mobile-stock" className="cursor-pointer">{t('filters.inStock', 'In Stock Only')}</Label>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 text-primary mr-2" />
                  <p className="text-muted-foreground">
                    {t('pagination.showing', 'Showing')} <span className="font-medium text-foreground">{sortedProducts.length}</span> {t('pagination.products', 'products')}
                  </p>
                </div>
                <div className="ml-auto">
                  <Select
                      value={filters.sort}
                      onValueChange={(value) => setFilters({ ...filters, sort: value })}
                  >
                    <SelectTrigger className="w-[180px] shadow-sm dark:border-slate-700">
                      <SelectValue placeholder={t('filters.sort.title', 'Sort by')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">{t('filters.sort.featured', 'Featured')}</SelectItem>
                      <SelectItem value="newest">{t('filters.sort.newest', 'Newest')}</SelectItem>
                      <SelectItem value="price-asc">{t('filters.sort.priceAsc', 'Price: Low to High')}</SelectItem>
                      <SelectItem value="price-desc">{t('filters.sort.priceDesc', 'Price: High to Low')}</SelectItem>
                      <SelectItem value="rating">{t('filters.sort.rating', 'Best Rating')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                  // Loading skeleton with shimmer effect - Enhanced for dark mode
                  <div className=" grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden relative rounded-xl border-muted/20 dark:border-slate-700/50">
                          <div className="aspect-square bg-gradient-to-r from-muted/70 via-muted to-muted/70 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" />
                          <div className="p-5 space-y-3">
                            <div className="h-5 bg-gradient-to-r from-muted/70 via-muted to-muted/70 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse rounded-md w-3/4" />
                            <div className="h-4 bg-gradient-to-r from-muted/70 via-muted to-muted/70 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse rounded-md w-1/2" />
                            <div className="h-6 bg-gradient-to-r from-muted/70 via-muted to-muted/70 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse rounded-md w-1/3 mt-4" />
                          </div>
                        </Card>
                    ))}
                  </div>
              ) : sortedProducts.length > 0 ? (
                  <AnimatePresence>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        key={`grid-${selectedCategory}-${filters.sort}-${filters.rating}-${filters.inStock}`}
                    >
                      {sortedProducts.map((product) => (
                          <motion.div key={product.id} variants={fadeInUp}>
                            <Card className="group overflow-hidden h-full flex flex-col border-muted/20 dark:border-slate-700/50 hover:border-primary/30 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl">
                              <Link href={`/product/${product.id}`} className="flex-1 flex flex-col">
                                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/10 to-muted/30 dark:from-slate-900/90 dark:to-slate-800/90">
                                  {product.images && product.images.length > 0 ? (
                                      <img
                                          src={product.images[0]}
                                          alt={product.designation}
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                      />
                                  ) : (
                                      <div className="w-full h-full bg-muted/30 dark:bg-slate-800/60 flex items-center justify-center">
                                        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                                      </div>
                                  )}

                                  {/* Hover overlay with gradient - Enhanced for dark mode */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent dark:from-slate-900/95 dark:via-slate-900/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                  {/* Ribbon for special products */}
                                  {product.category && product.category.name === "Featured" && (
                                      <div className="absolute -right-12 top-6 rotate-45 bg-primary text-primary-foreground py-1 px-10 text-xs font-bold shadow-md">
                                        {t('products.featured', 'FEATURED')}
                                      </div>
                                  )}

                                  {/* Category badge - Enhanced for dark mode */}
                                  {product.category && (
                                      <Badge className="absolute top-3 left-3 bg-background/90 text-black hover:text-white dark:hover:text-gray-800 dark:hover:bg-amber-50 dark:bg-slate-900/90 dark:text-gray-300 backdrop-blur-sm shadow-md border-0 px-3 py-1.5">
                                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                                        {product.category.name}
                                      </Badge>
                                  )}

                                  {/* Out of stock overlay - Enhanced for dark mode */}
                                  {product.qteStock === 0 && (
                                      <div className="absolute inset-0 bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                                        <Badge variant="destructive" className="text-sm font-semibold px-6 py-2 shadow-md">{t('products.outOfStock', 'Out of Stock')}</Badge>
                                      </div>
                                  )}

                                  {/* Quick action buttons - Enhanced for dark mode */}
                                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className={`h-10 w-10 rounded-full bg-background/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground ${
                                            isFavorite(product.id) ? 'text-red-500 hover:text-red-500' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleFavorite(product.id)
                                        }}
                                        disabled={isFavoriteLoading}
                                    >
                                      <Heart
                                          className="h-5 w-5"
                                          fill={isFavorite(product.id) ? 'currentColor' : 'none'}
                                      />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-10 w-10 rounded-full bg-background/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground"
                                    >
                                      <Bookmark className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>

                                <CardContent className="flex-1 flex flex-col p-5">
                                  {/* Product title */}
                                  <h3 className="font-medium text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                                    {product.designation}
                                  </h3>

                                  {/* Product description if available */}
                                  {product.description && (
                                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                        {product.description}
                                      </p>
                                  )}

                                  {/* Stock indicator */}
                                  {product.qteStock > 0 && (
                                      <div className="flex items-center mt-auto mb-3">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    product.qteStock > 10 ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></span>
                                        <span className="text-xs text-muted-foreground">
                                  {product.qteStock > 10 ? t('products.inStock', 'In Stock') : `${t('products.onlyLeft', 'Only')} ${product.qteStock} ${t('products.leftInStock', 'left in stock')}`}
                                </span>
                                      </div>
                                  )}
                                </CardContent>

                                <CardFooter className="px-5 py-4 border-t border-muted/30 dark:border-slate-700/50 bg-muted/5 dark:bg-slate-900/30">
                                  <div className="flex items-center justify-between w-full">
                                    <p className="text-xl font-bold text-primary">{product.prix} TND</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full bg-transparent border-primary text-primary hover:bg-primary dark:hover:text-gray-800 dark:hover:bg-amber-50 hover:text-primary-foreground transition-all duration-300 dark:bg-slate-900/50"
                                    >
                                      {t('products.viewDetails', 'View Details')}
                                    </Button>
                                  </div>
                                </CardFooter>
                              </Link>
                            </Card>
                          </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
              ) : (
                  <motion.div
                      className="text-center py-16 px-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
                      <Search className="h-10 w-10 text-primary/60" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">{t('emptyState.title', 'No Products Found')}</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      {t('emptyState.description', 'We couldn\'t find any products matching your criteria.')}
                    </p>
                    <Button onClick={clearFilters} size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-md">
                      {t('emptyState.clearFilters', 'Clear Filters')}
                    </Button>
                  </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}