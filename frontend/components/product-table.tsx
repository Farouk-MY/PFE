"use client"

import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Edit,
    MoreVertical,
    Trash,
    RefreshCw,
    AlertTriangle,
    Filter,
    Eye,
    Package, X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Product } from '@/store'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import '@/i18n'

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    onEdit: (product: Product) => void;
    onDelete: (productId: number) => void;
    onRefresh?: () => Promise<void>;
    onViewDetails?: (product: Product) => void;
}

export function ProductTable({
                                 products,
                                 isLoading,
                                 onEdit,
                                 onDelete,
                                 onRefresh,
                                 onViewDetails
                             }: ProductTableProps) {
    // Initialize i18n translation
    const { t } = useTranslation(['products', 'common']);
    const [sortField, setSortField] = useState<string>('')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [itemsPerPage, setItemsPerPage] = useState<number>(10)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
    const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all')

    // Reset pagination when products change
    useEffect(() => {
        setCurrentPage(1);
    }, [products, categoryFilter, stockFilter]);

    // Filter products to show only non-deleted ones and apply additional filters
    const filteredProducts = products.filter(product => {
        // Filter out deleted products
        if (product.deleted) return false;

        // Apply category filter if active
        if (categoryFilter !== null && product.categoryId !== categoryFilter) return false;

        // Apply stock filter if active
        if (stockFilter === 'low' && product.qteStock > product.seuilMin) return false;

        return true;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortField) return 0;

        const aValue = a[sortField as keyof Product];
        const bValue = b[sortField as keyof Product];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        // Handle numeric comparisons
        const aNum = typeof aValue === 'number' ? aValue : 0;
        const bNum = typeof bValue === 'number' ? bValue : 0;

        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleDeleteClick = (product: Product) => {
        setSelectedProduct(product);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedProduct) {
            onDelete(selectedProduct.id);
            setDeleteConfirmOpen(false);
            setSelectedProduct(null);
        }
    };

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500); // Give visual feedback
        }
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const resetFilters = () => {
        setCategoryFilter(null);
        setStockFilter('all');
        setSortField('');
        setSortDirection('asc');
    };

    // Get unique categories for filtering
    const uniqueCategories = Array.from(
        new Set(products.filter(p => !p.deleted).map(p => p.categoryId))
    ).filter(id => id !== undefined) as number[];

    // Handle rendering loading state
    if (isLoading && !isRefreshing && filteredProducts.length === 0) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('products:image')}</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>{t('products:category')}</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Min Stock</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array(5).fill(0).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // Handle empty state
    if (!isLoading && paginatedProducts.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {stockFilter === 'low' || categoryFilter !== null ? (
                        <>
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Filter className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{t('products:noProductsMatchFilters')}</h3>
                            <p className="text-muted-foreground max-w-md">
                                {t('products:tryChangingFilters')}
                            </p>
                            <Button variant="outline" onClick={resetFilters}>{t('products:resetFilters')}</Button>
                        </>
                    ) : (
                        <>
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Package className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{t('products:noProductsFound')}</h3>
                            <p className="text-muted-foreground max-w-md">
                                {t('products:noProductsInCatalog')}
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="rounded-md border">
                <div className="p-2 flex items-center justify-between border-b">
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                    <Filter className="h-3.5 w-3.5" />
                                    {t('products:filters')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>{t('products:filterByStock')}</DropdownMenuLabel>
                                <DropdownMenuItem
                                    className={stockFilter === 'all' ? 'bg-accent' : ''}
                                    onClick={() => setStockFilter('all')}
                                >
                                    {t('products:allProducts')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={stockFilter === 'low' ? 'bg-accent' : ''}
                                    onClick={() => setStockFilter('low')}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                    {t('products:lowStock')}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>{t('products:filterByCategory')}</DropdownMenuLabel>
                                <DropdownMenuItem
                                    className={categoryFilter === null ? 'bg-accent' : ''}
                                    onClick={() => setCategoryFilter(null)}
                                >
                                    {t('products:allCategories')}
                                </DropdownMenuItem>
                                {products
                                    .filter(p => !p.deleted && p.category)
                                    .reduce((acc: {id: number, name: string}[], product) => {
                                        if (product.category && !acc.some(c => c.id === product.category!.id)) {
                                            acc.push({id: product.category.id, name: product.category.name});
                                        }
                                        return acc;
                                    }, [])
                                    .map(category => (
                                        <DropdownMenuItem
                                            key={category.id}
                                            className={categoryFilter === category.id ? 'bg-accent' : ''}
                                            onClick={() => setCategoryFilter(category.id)}
                                        >
                                            {category.name}
                                        </DropdownMenuItem>
                                    ))
                                }

                                {(stockFilter !== 'all' || categoryFilter !== null) && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={resetFilters}>
                                            {t('products:resetAllFilters')}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {(stockFilter !== 'all' || categoryFilter !== null) && (
                            <div className="flex gap-1">
                                {stockFilter === 'low' && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                        {t('products:lowStock')}
                                        <button
                                            onClick={() => setStockFilter('all')}
                                            className="ml-1 rounded-full hover:bg-accent h-4 w-4 inline-flex items-center justify-center"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {categoryFilter !== null && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        {products.find(p => p.categoryId === categoryFilter)?.category?.name || t('products:category')}
                                        <button
                                            onClick={() => setCategoryFilter(null)}
                                            className="ml-1 rounded-full hover:bg-accent h-4 w-4 inline-flex items-center justify-center"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing || isLoading}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('products:refreshProducts')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    {itemsPerPage} {t('products:perPage')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {[5, 10, 25, 50, 100].map(value => (
                                    <DropdownMenuItem
                                        key={value}
                                        onClick={() => handleItemsPerPageChange(value)}
                                        className={itemsPerPage === value ? 'bg-accent' : ''}
                                    >
                                        {value} {t('products:perPage')}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('products:image')}</TableHead>
                            <TableHead
                                onClick={() => handleSort('designation')}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                                {t('products:productName')}
                                {sortField === 'designation' && (
                                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </TableHead>
                            <TableHead>{t('products:category')}</TableHead>
                            <TableHead
                                onClick={() => handleSort('prix')}
                                className="cursor-pointer hover:bg-accent/50 transition-colors text-right"
                            >
                                {t('products:price')}
                                {sortField === 'prix' && (
                                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort('qteStock')}
                                className="cursor-pointer hover:bg-accent/50 transition-colors text-right"
                            >
                                {t('products:stock')}
                                {sortField === 'qteStock' && (
                                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort('seuilMin')}
                                className="cursor-pointer hover:bg-accent/50 transition-colors text-right"
                            >
                                {t('products:minimumStock')}
                                {sortField === 'seuilMin' && (
                                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort('nbrPoint')}
                                className="cursor-pointer hover:bg-accent/50 transition-colors text-right"
                            >
                                {t('products:points')}
                                {sortField === 'nbrPoint' && (
                                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isRefreshing ? (
                            // Show skeleton when refreshing
                            Array(Math.min(5, itemsPerPage)).fill(0).map((_, index) => (
                                <TableRow key={`skeleton-${index}`} className="animate-pulse">
                                    <TableCell><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            paginatedProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.designation}
                                                className="h-12 w-12 rounded-lg object-cover bg-gray-100"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                }}
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <span className="text-xs text-gray-500">{t('products:noImage')}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{product.designation}</TableCell>
                                    <TableCell>
                                        {product.category ? (
                                            <Badge variant="outline">{product.category.name}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">{t('products:noCategory')}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${product.prix.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge
                                                        variant={product.qteStock <= product.seuilMin ?
                                                            (product.qteStock === 0 ? "destructive" : "outline") :
                                                            "default"}
                                                        className={product.qteStock <= product.seuilMin ?
                                                            (product.qteStock === 0 ? "" : "border-amber-500 text-amber-500") :
                                                            ""}
                                                    >
                                                        {product.qteStock === 0 ? (
                                                            t('products:outOfStock')
                                                        ) : (
                                                            <>
                                                                {product.qteStock}
                                                                {product.qteStock <= product.seuilMin && (
                                                                    <AlertTriangle className="ml-1 h-3 w-3 inline-block" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TooltipTrigger>
                                                {product.qteStock <= product.seuilMin && (
                                                    <TooltipContent>
                                                        <p>{t('products:stockBelowThreshold', { threshold: product.seuilMin })}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right">{product.seuilMin}</TableCell>
                                    <TableCell className="text-right">{product.nbrPoint}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {onViewDetails && (
                                                    <DropdownMenuItem onClick={() => onViewDetails(product)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t('products:viewDetails')}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => onEdit(product)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    {t('common:edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteClick(product)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    {t('common:delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t('products:showingProducts', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, sortedProducts.length), total: sortedProducts.length })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            {t('common:previous')}
                        </Button>
                        {totalPages > 5 ? (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                {totalPages > 3 && currentPage > 3 && <span className="px-2">...</span>}
                                {currentPage > 3 && currentPage < totalPages && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                    >
                                        {currentPage}
                                    </Button>
                                )}
                                {totalPages > 3 && currentPage < totalPages - 2 && <span className="px-2">...</span>}
                                {totalPages > 3 && (
                                    <Button
                                        variant={currentPage === totalPages ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(totalPages)}
                                    >
                                        {totalPages}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t('common:next')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common:areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('products:deleteConfirmation', { name: selectedProduct?.designation })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t('common:delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}