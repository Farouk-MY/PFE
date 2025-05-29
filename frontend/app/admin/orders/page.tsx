"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import {
    Search,
    Filter,
    MoreVertical,
    Package,
    User,
    CreditCard,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    Mail,
    Loader2,
} from 'lucide-react'
import { useAdminCommandeStore, OrderStatus, OrderSummary, OrderDetails } from '@/store'
import { format } from 'date-fns'

const getStatusOptions = (t: any) => [
    { value: 'all', label: t('orders:allOrders') },
    { value: 'en_attente', label: t('orders:pending') },
    { value: 'en_preparation', label: t('orders:processing') },
    { value: 'en_cours_livraison', label: t('orders:shipped') },
    { value: 'livrée', label: t('orders:delivered') },
    { value: 'annulée', label: t('orders:cancelled') },
]

export default function OrdersPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['orders', 'common'])
    const { language } = useLanguage()
    const statusOptions = getStatusOptions(t)
    const {
        orders,
        currentOrder,
        isLoading,
        error,
        pagination,
        searchTerm,
        statusFilter,
        sortOrder,
        getAllOrders,
        getOrderDetails,
        updateOrderStatus,
        setSearchTerm,
        setStatusFilter,
        setSortOrder,
        resetFilters,
        resetCurrentOrder,
    } = useAdminCommandeStore()

    const [showOrderDetails, setShowOrderDetails] = useState(false)
    const [localSearch, setLocalSearch] = useState('')

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localSearch)
        }, 500)

        return () => clearTimeout(timer)
    }, [localSearch, setSearchTerm])

    // Fetch orders on mount and when filters change
    useEffect(() => {
        getAllOrders(1, 10)
    }, [getAllOrders, searchTerm, statusFilter, sortOrder])

    const handlePageChange = (page: number) => {
        getAllOrders(page, pagination.limit)
    }

    const handleViewDetails = async (orderId: number) => {
        try {
            await getOrderDetails(orderId)
            setShowOrderDetails(true)
        } catch (error) {
            toast.error(t('orders:failedToLoadOrders'))
        }
    }

    const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
        try {
            const success = await updateOrderStatus(orderId, status)
            if (success) {
                toast.success(t('orders:statusUpdated'))
                setShowOrderDetails(false)
            }
        } catch (error) {
            toast.error(t('orders:failedToUpdateStatus'))
        }
    }

    const getStatusLabel = (status: OrderStatus | 'unknown') => {
        switch (status) {
            case 'en_attente': return t('orders:pending')
            case 'en_preparation': return t('orders:processing')
            case 'en_cours_livraison': return t('orders:shipped')
            case 'livrée': return t('orders:delivered')
            case 'annulée': return t('orders:cancelled')
            default: return status
        }
    }

    const getStatusBadge = (status: OrderStatus | 'unknown') => {
        switch (status) {
            case 'livrée':
                return <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> {t('orders:delivered')}</Badge>
            case 'en_preparation':
                return <Badge variant="default" className="bg-blue-500"><Clock className="mr-1 h-3 w-3" /> {t('orders:processing')}</Badge>
            case 'annulée':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> {t('orders:cancelled')}</Badge>
            case 'en_attente':
                return <Badge variant="secondary"><AlertCircle className="mr-1 h-3 w-3" /> {t('orders:pending')}</Badge>
            case 'en_cours_livraison':
                return <Badge variant="default" className="bg-purple-500"><Truck className="mr-1 h-3 w-3" /> {t('orders:shipped')}</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getPaymentStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return <Badge variant="default" className="bg-green-500">{t('orders:paid')}</Badge>
            case 'pending':
                return <Badge variant="secondary">{t('orders:pending')}</Badge>
            case 'failed':
                return <Badge variant="destructive">{t('orders:failed')}</Badge>
            default:
                return <Badge variant="outline">{status || t('orders:unknown')}</Badge>
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
        }).format(amount);
    };


    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-col md:flex-row">
                <AdminSidebar />

                <div className="flex-1 p-4 sm:p-6 md:p-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{t('orders:title')}</h1>
                                <p className="text-muted-foreground">
                                    {t('orders:subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="mb-6">
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('orders:searchOrders')}
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Select
                                        value={statusFilter || 'all'}
                                        onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value as OrderStatus)}
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder={t('orders:filterByStatus')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setLocalSearch('')
                                            resetFilters()
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        {t('common:resetFilters')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        {isLoading && !orders.length ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-destructive">{error}</div>
                        ) : (
                            <>
                                {/* Desktop view - Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('orders:orderID')}</TableHead>
                                                <TableHead>{t('orders:customer')}</TableHead>
                                                <TableHead>{t('orders:date')}</TableHead>
                                                <TableHead>{t('orders:total')}</TableHead>
                                                <TableHead>{t('orders:status')}</TableHead>
                                                <TableHead>{t('orders:paymentMethod')}</TableHead>
                                                <TableHead className="w-[100px]">{t('orders:actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{order.clientName}</p>
                                                            <p className="text-sm text-muted-foreground">{order.clientEmail}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(order.date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(order.total)}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                    <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleViewDetails(order.id)}
                                                                >
                                                                    <Package className="mr-2 h-4 w-4" />
                                                                    {t('orders:viewDetails')}
                                                                </DropdownMenuItem>
                                                                {order.status !== 'livrée' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusUpdate(order.id, 'livrée')}
                                                                        className="text-green-600"
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        {t('orders:markAsDelivered')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile view - Cards */}
                                <div className="md:hidden space-y-4 p-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-4 space-y-3 bg-card">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">#{order.id}</p>
                                                    <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {getStatusBadge(order.status)}
                                                    <p className="font-medium mt-1">{formatCurrency(order.total)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{order.clientName}</p>
                                                        <p className="text-xs text-muted-foreground">{order.clientEmail}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('orders:paymentMethod')}</p>
                                                    <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</div>
                                                </div>
                                                <Button 
                                                    onClick={() => handleViewDetails(order.id)}
                                                    size="sm"
                                                    className="gap-1"
                                                >
                                                    <Package className="h-4 w-4" />
                                                    {t('orders:viewDetails')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {pagination.pages > 1 && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t gap-4">
                                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                                            {t('orders:showingPage', { current: pagination.page, total: pagination.pages })}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.page === 1}
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                            >
                                                {t('common:previous')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.page === pagination.pages}
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                            >
                                                {t('common:next')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>

            {/* Order Details Modal */}
            <Dialog open={showOrderDetails} onOpenChange={(open) => {
                if (!open) {
                    setShowOrderDetails(false)
                    resetCurrentOrder()
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{t('orders:orderDetails')} #{currentOrder?.id}</DialogTitle>
                    </DialogHeader>

                    {currentOrder && (
                        <div className="space-y-6">
                            {/* Order Header */}
                            <div className="flex items-center justify-between pb-4 border-b">
                                <div>
                                    <h3 className="text-lg font-semibold">{t('orders:order')} #{currentOrder.id}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('orders:placedOn')} {formatDate(currentOrder.orderInfo.date)}
                                        {currentOrder.orderInfo.deliveryDate && (
                                            <span className="ml-4">
                        {t('orders:deliveryScheduled')} {formatDate(currentOrder.orderInfo.deliveryDate)}
                      </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(currentOrder.orderInfo.status)}
                                </div>
                            </div>

                            {/* Responsive layout for customer and payment info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Customer Information */}
                                <div className="space-y-4">
                                    <Card>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="h-5 w-5" />
                                                <h4>{t('orders:customerDetails')}</h4>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">{currentOrder.clientInfo.name}</p>
                                                <p className="text-sm text-muted-foreground">{currentOrder.clientInfo.email}</p>
                                                <p className="text-sm text-muted-foreground">{currentOrder.clientInfo.phone}</p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Truck className="h-5 w-5" />
                                                <h4>{t('orders:shippingAddress')}</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm">{currentOrder.orderInfo.deliveryAddress}</p>
                                                {currentOrder.clientInfo.address && (
                                                    <p className="text-sm">
                                                        {currentOrder.clientInfo.address.city}, {currentOrder.clientInfo.address.governorate} {currentOrder.clientInfo.address.postalCode}
                                                    </p>
                                                )}
                                                {currentOrder.orderInfo.deliveryPerson && (
                                                    <div className="mt-2 pt-2 border-t">
                                                        <p className="text-sm font-medium">{t('orders:deliveryPerson')}:</p>
                                                        <p className="text-sm">{currentOrder.orderInfo.deliveryPerson}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Payment and Financial Information */}
                                <div className="space-y-4">
                                    <Card>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-2 font-medium">
                                                <CreditCard className="h-5 w-5" />
                                                <h4>{t('orders:paymentInformation')}</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">{t('orders:method')}</p>
                                                    <p>{currentOrder.paymentInfo.method || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{t('orders:status')}</p>
                                                    <p>{getPaymentStatusBadge(currentOrder.paymentInfo.status)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{t('orders:date')}</p>
                                                    <p>{formatDate(currentOrder.paymentInfo.date)}</p>
                                                </div>
                                                {currentOrder.paymentInfo.cardDetails && (
                                                    <div>
                                                        <p className="text-muted-foreground">{t('orders:cardDetails')}</p>
                                                        <p>{currentOrder.paymentInfo.cardDetails}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-2 font-medium">
                                                <CreditCard className="h-5 w-5" />
                                                <h4>{t('orders:financialSummary')}</h4>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('orders:subtotal')}</span>
                                                    <span>{formatCurrency(currentOrder.financialInfo.subtotal)}</span>
                                                </div>
                                                {currentOrder.financialInfo.discount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('orders:discount')}</span>
                                                        <span className="text-green-600">
                              -{formatCurrency(currentOrder.financialInfo.discount)}
                                                            {currentOrder.financialInfo.discountPercentage > 0 && (
                                                                <span className="text-xs ml-1">({currentOrder.financialInfo.discountPercentage}%)</span>
                                                            )}
                            </span>
                                                    </div>
                                                )}
                                                {currentOrder.financialInfo.pointsUsed > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('orders:pointsUsed')}</span>
                                                        <span className="text-blue-600">
                              -{formatCurrency(currentOrder.financialInfo.pointsAmount)}
                                                            <span className="text-xs ml-1">({currentOrder.financialInfo.pointsUsed} points)</span>
                            </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('orders:deliveryFee')}</span>
                                                    <span>{formatCurrency(currentOrder.financialInfo.deliveryFee)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t font-medium">
                                                    <span>{t('orders:total')}</span>
                                                    <span>{formatCurrency(currentOrder.financialInfo.totalAmount)}</span>
                                                </div>
                                                {currentOrder.financialInfo.pointsEarned > 0 && (
                                                    <div className="flex justify-between pt-1">
                                                        <span className="text-muted-foreground">{t('orders:pointsEarned')}</span>
                                                        <span className="text-green-600">+{currentOrder.financialInfo.pointsEarned} points</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Order Items */}
                            <Card>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Package className="h-5 w-5" />
                                        <h4>{t('orders:orderItems')} ({currentOrder.items.length})</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {currentOrder.items.map((item) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border">
                                                <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                                    {item.image && (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 mt-2 sm:mt-0">
                                                    <h5 className="font-medium truncate">{item.name}</h5>
                                                    <p className="text-sm text-muted-foreground">{t('orders:productID')}: {item.productId}</p>
                                                </div>
                                                <div className="text-left sm:text-right mt-2 sm:mt-0 w-full sm:w-auto">
                                                    <p className="font-medium">{formatCurrency(item.price)} × {item.quantity}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('orders:subtotal')}: {formatCurrency(item.subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                                <div className="flex gap-2 mb-3 sm:mb-0">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                        <Mail className="mr-2 h-4 w-4" />
                                        {t('orders:sendEmail')}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                    {currentOrder.orderInfo.status !== 'en_preparation' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(currentOrder.id, 'en_preparation')}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            {t('orders:markAsProcessing')}
                                        </Button>
                                    )}
                                    {currentOrder.orderInfo.status !== 'en_cours_livraison' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(currentOrder.id, 'en_cours_livraison')}
                                        >
                                            <Truck className="mr-2 h-4 w-4" />
                                            {t('orders:markAsInDelivery')}
                                        </Button>
                                    )}
                                    {currentOrder.orderInfo.status !== 'livrée' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleStatusUpdate(currentOrder.id, 'livrée')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {t('orders:markAsDelivered')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}