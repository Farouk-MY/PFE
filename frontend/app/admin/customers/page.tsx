"use client"

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    Download,
    MoreVertical,
    User,
    Ban,
    CheckCircle,
    AlertCircle,
    ShoppingBag,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAdminControllerStore } from '@/store'

// Define User interface with additional customer fields
interface Customer {
    id: string;
    nom?: string;
    email: string;
    telephone?: string;
    adresse?: string;
    statut: string;
    dateCreation: string;
    commandes?: number;
    totalDepense?: number;
    derniereCommande?: string;
    points?: number;
}

export default function CustomersPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['customers', 'common'])
    const { language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    // Get admin controller functions from store
    const {
        users,
        isLoading,
        error,
        getAllUsers,
        searchUsers,
        blockUser,
        unblockUser,
        exportUsers,
        getUserById
    } = useAdminControllerStore()

    // Fetch customers on page load
    useEffect(() => {
        getAllUsers()
    }, [])

    // Handle search with debounce
    useEffect(() => {
        if (searchQuery.trim() === '') {
            getAllUsers()
            return
        }

        const timer = setTimeout(() => {
            setIsSearching(true)
            searchUsers(searchQuery)
                .finally(() => setIsSearching(false))
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Transform User objects to Customer interface
    const customers: Customer[] = users.map(user => ({
        id: user.id,
        nom: user.nom || user.prenom + ' ' + user.nom || 'N/A',
        email: user.email,
        telephone: user.telephone || 'N/A',
        adresse: user.adresse || 'N/A',
        statut: user.statut || 'actif',
        dateCreation: user.dateCreation || new Date().toISOString(),
        commandes: user.commandes || 0,
        totalDepense: user.totalDepense || 0,
        derniereCommande: user.derniereCommande || '',
        points: user.points || 0
    }))

    const handleExport = (format: 'csv' | 'pdf') => {
        exportUsers(format)
            .then(() => toast.success(`Customer list exported as ${format.toUpperCase()}`))
            .catch(() => toast.error(`Failed to export customer list as ${format.toUpperCase()}`))
    }

    const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
        try {
            if (currentStatus === 'actif') {
                await blockUser(customerId)
                toast.success('Customer blocked successfully')
            } else {
                await unblockUser(customerId)
                toast.success('Customer unblocked successfully')
            }
        } catch (error) {
            toast.error('Failed to update customer status')
        }
    }

    const viewCustomerDetails = async (customerId: string) => {
        try {
            const customer = await getUserById(customerId)
            if (customer) {
                setSelectedCustomer(customer as Customer)
                setShowDetails(true)
            } else {
                toast.error('Customer details not found')
            }
        } catch (error) {
            toast.error('Failed to fetch customer details')
        }
    }

    // Format date safely
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'
        try {
            return format(new Date(dateString), 'MMM d, yyyy')
        } catch (error) {
            return 'Invalid date'
        }
    }

    if (error) {
        toast.error(error)
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex">
                <AdminSidebar />

                <div className="flex-1 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                        <p className="text-muted-foreground">
                            {t('subtitle')}
                        </p>
                    </div>

                    <Card className="mb-8">
                        <div className="p-6 flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="gap-2">
                                        <Download className="h-4 w-4" />
                                        {t('exportList')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                                        {t('exportAsCsv')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                        {t('exportAsPdf')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="overflow-x-auto">
                            {isLoading || isSearching ? (
                                <div className="flex justify-center items-center p-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                                <TableHead>{t('name')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead>{t('orders')}</TableHead>
                                <TableHead>{t('spent')}</TableHead>
                                <TableHead>{t('points')}</TableHead>
                                <TableHead>{t('joinedOn')}</TableHead>
                                <TableHead>{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No customers found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            customers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                <User className="size-5 text-gray-600 dark:text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{customer.nom}</p>
                                                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={customer.statut === 'actif' ? 'default' : 'destructive'}>
                                                            {customer.statut === 'actif' ? t('active') : t('blocked')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <ShoppingBag className="size-4 text-muted-foreground" />
                                                            {customer.commandes || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>${(customer.totalDepense || 0).toFixed(2)}</TableCell>
                                                    <TableCell>{customer.points || 0}</TableCell>
                                                    <TableCell>{formatDate(customer.dateCreation)}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => viewCustomerDetails(customer.id)}>
                                                    {t('viewDetails')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleCustomerStatus(customer.id, customer.statut)}>
                                                    {customer.statut === 'actif' ? t('blockCustomer') : t('unblockCustomer')}
                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>

                    {/* Customer Details Dialog */}
                    <Dialog open={showDetails} onOpenChange={setShowDetails}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('customerDetails')}</DialogTitle>
                                <DialogDescription>
                                    {t('detailedInfo')}
                                </DialogDescription>
                            </DialogHeader>

                            {selectedCustomer && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <Card className="p-6">
                                        <h3 className="font-semibold mb-4">{t('personalInfo')}</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <User className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('name')}</p>
                                                    <p className="font-medium">{selectedCustomer.nom}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Mail className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('email')}</p>
                                                    <p className="font-medium">{selectedCustomer.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Phone className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('phone')}</p>
                                                    <p className="font-medium">{selectedCustomer.telephone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('location')}</p>
                                                    <p className="font-medium">{selectedCustomer.adresse}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <h3 className="font-semibold mb-4">{t('accountInfo')}</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('joinDate')}</p>
                                                    <p className="font-medium">
                                                        {formatDate(selectedCustomer.dateCreation)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedCustomer.statut === 'actif' ? (
                                                    <CheckCircle className="size-5 text-green-500" />
                                                ) : (
                                                    <Ban className="size-5 text-red-500" />
                                                )}
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('accountStatus')}</p>
                                                    <p className="font-medium capitalize">{selectedCustomer.statut}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ShoppingBag className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                                                    <p className="font-medium">{selectedCustomer.commandes || 0}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t('lastOrder')}</p>
                                                    <p className="font-medium">
                                                        {selectedCustomer.derniereCommande ?
                                                            formatDate(selectedCustomer.derniereCommande) :
                                                            t('noOrdersYet')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                        <Card className="p-6">
                                            <h3 className="font-semibold mb-4">{t('totalSpent')}</h3>
                                            <p className="text-3xl font-bold">${(selectedCustomer.totalDepense || 0).toFixed(2)}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{t('lifetimeValue')}</p>
                                        </Card>

                                        <Card className="p-6">
                                            <h3 className="font-semibold mb-4">{t('rewardPoints')}</h3>
                                            <p className="text-3xl font-bold">{selectedCustomer.points || 0}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                ≈ ${((selectedCustomer.points || 0) * 0.01).toFixed(2)} {t('value')}
                                            </p>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}