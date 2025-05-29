"use client"

import { useState, useEffect, useCallback } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { ProductTable } from '@/components/product-table'
import { ProductModal } from '@/components/product-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Product, useAdminControllerStore } from '@/store'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

// Custom hook for debounced search
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export default function AdminProducts() {
    // Initialize i18n translation
    const { t } = useTranslation(['products', 'common'])
    const { language } = useLanguage()
    
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const { toast } = useToast()
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Get necessary functions from the admin controller store
    const {
        isLoading: storeLoading,
        error,
        products,
        getAllProducts,
        searchProducts,
        deleteProduct,
        clearError
    } = useAdminControllerStore()

    const [isLoading, setIsLoading] = useState(false)

    // Combined loading state
    const combinedLoading = isLoading || storeLoading

    // Effect to show toast on error
    useEffect(() => {
        if (error) {
            toast({
                title: t('common:error'),
                description: error,
                variant: "destructive",
            })
            clearError()
        }
    }, [error, toast, clearError])

    // Load products when the component mounts
    useEffect(() => {
        loadProducts()
    }, [])

    // Search products when debounced search query changes
    useEffect(() => {
        const handleSearch = async () => {
            if (debouncedSearchQuery.trim()) {
                setIsSearching(true)
                try {
                    await searchProducts(debouncedSearchQuery)
                } catch (error) {
                    toast({
                        title: "Error",
                        description: t('products:failedToSearchProducts'),
                        variant: "destructive",
                    })
                } finally {
                    setIsSearching(false)
                }
            } else {
                // If search is empty, load all products
                loadProducts()
            }
        }

        handleSearch()
    }, [debouncedSearchQuery, searchProducts, toast])

    const loadProducts = useCallback(async () => {
        setIsLoading(true)
        try {
            await getAllProducts()
        } catch (error) {
            toast({
                title: "Error",
                description: t('products:failedToLoadProducts'),
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [getAllProducts, toast])

    const handleAddProduct = () => {
        setEditingProduct(null)
        setIsModalOpen(true)
    }

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product)
        setIsModalOpen(true)
    }

    const handleDeleteProduct = async (productId: number) => {
        setIsLoading(true)
        try {
            const success = await deleteProduct(productId)

            if (success) {
                toast({
                    title: t('products:productDeleted'),
                    description: t('products:deleteProductSuccess'),
                })
            } else {
                throw new Error("Failed to delete product")
            }
        } catch (error) {
            toast({
                    title: t('common:error'),
                    description: t('products:failedToDeleteProduct'),
                    variant: "destructive",
                })
        } finally {
            setIsLoading(false)
        }
    }

    const handleModalSuccess = () => {
        // Refresh the product list after successful create/update
        loadProducts()
        toast({
            title: editingProduct ? t('products:productUpdated') : t('products:productCreated'),
            description: editingProduct ? t('products:productUpdated') : t('products:productCreated'),
        })
    }

    const clearSearch = () => {
        setSearchQuery('')
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex">
                <AdminSidebar />

                <div className="flex-1 p-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{t('products:title')}</h1>
                            <p className="text-muted-foreground">
                                {t('products:subtitle')}
                            </p>
                            </div>
                            <Button onClick={handleAddProduct} className="gap-2" disabled={combinedLoading}>
                                <Plus className="h-4 w-4" />
                                {t('products:addProduct')}
                            </Button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('products:searchProducts')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {searchQuery && !isSearching && products.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                {t('products:noProductsFound')} "{searchQuery}"
                            </p>
                        )}
                        {isSearching && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Searching...
                            </p>
                        )}
                    </div>

                    <ProductTable
                        products={products}
                        isLoading={combinedLoading}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onRefresh={loadProducts}
                    />

                    <ProductModal
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        product={editingProduct}
                        onSuccess={handleModalSuccess}
                    />
                </div>
            </div>
        </div>
    )
}