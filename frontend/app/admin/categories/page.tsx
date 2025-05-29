"use client"

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAdminControllerStore } from '@/store'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card } from '@/components/ui/card'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function AdminCategories() {
    // Initialize i18n translation
    const { t } = useTranslation(['categories', 'common'])
    const { language } = useLanguage()
    
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryName, setCategoryName] = useState('')
    const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null)
    const { toast } = useToast()
    const { categories, getAllCategories, createCategory, updateCategory, deleteCategory, isLoading } = useAdminControllerStore()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            await getAllCategories()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load categories. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleSearch = async (query: string) => {
        try {
            const { searchCategories } = useAdminControllerStore.getState()
            await searchCategories(query)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to search categories.",
                variant: "destructive",
            })
        }
    }

    const debouncedSearch = debounce(handleSearch, 300)

    const handleAddCategory = () => {
        setEditingCategory(null)
        setCategoryName('')
        setIsModalOpen(true)
    }

    const handleEditCategory = (category: { id: number; name: string }) => {
        setEditingCategory(category)
        setCategoryName(category.name)
        setIsModalOpen(true)
    }

    const handleDeleteClick = (category: { id: number; name: string }) => {
        setSelectedCategory(category)
        setDeleteConfirmOpen(true)
    }

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
            toast({
                title: "Error",
                description: "Category name is required",
                variant: "destructive",
            })
            return
        }

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryName)
                toast({
                    title: "Success",
                    description: "Category updated successfully",
                })
            } else {
                await createCategory(categoryName)
                toast({
                    title: "Success",
                    description: "Category created successfully",
                })
            }
            setIsModalOpen(false)
            setCategoryName('')
            setEditingCategory(null)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save category. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleDeleteConfirm = async () => {
        if (selectedCategory) {
            try {
                await deleteCategory(selectedCategory.id)
                toast({
                    title: "Success",
                    description: "Category deleted successfully",
                })
                setDeleteConfirmOpen(false)
                setSelectedCategory(null)
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete category. It may have associated products.",
                    variant: "destructive",
                })
            }
        }
    }

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex">
                <AdminSidebar />
                <div className="flex-1 p-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{t('categories:title')}</h1>
                                <p className="text-muted-foreground">
                                    {t('categories:subtitle')}
                                </p>
                            </div>
                            <Button onClick={handleAddCategory} className="gap-2" disabled={isLoading}>
                                <Plus className="h-4 w-4" />
                                {t('categories:addCategory')}
                            </Button>
                        </div>
                    </div>
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('categories:searchCategories')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    debouncedSearch(e.target.value)
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    {isLoading && filteredCategories.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <Card key={index} className="p-6 animate-pulse">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </Card>
                            ))}
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">{t('categories:noCategories')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCategories.map((category) => (
                                <Card key={category.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{category.name}</h3>
                                            <p className="text-sm text-muted-foreground">{category._count?.produits || 0} products</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditCategory(category)}
                                                aria-label={t('categories:editCategory')}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(category)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                aria-label={t('categories:deleteCategory')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? t('categories:editCategory') : t('categories:addCategory')}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingCategory
                                        ? t('categories:updateCategoryDesc')
                                        : t('categories:createCategoryDesc')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder={t('categories:categoryName')}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isLoading}
                                >
                                    {t('common:cancel')}
                                </Button>
                                <Button onClick={handleSubmit} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {editingCategory ? t('categories:updating') : t('categories:creating')}
                                        </>
                                    ) : (
                                        editingCategory ? t('categories:updateCategory') : t('categories:createCategory')
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('categories:deleteConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('categories:deleteConfirmMessage')}
                                    <span className="font-semibold"> {selectedCategory?.name}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteConfirm}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('categories:deleting')}
                                        </>
                                    ) : (
                                        t('common:delete')
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}