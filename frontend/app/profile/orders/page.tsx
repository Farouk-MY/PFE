"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSidebar } from "@/components/profile-sidebar";
import {
    Package,
    Search,
    Filter,
    ChevronDown,
    Calendar,
    Clock,
    Receipt,
    ArrowRight,
    Download,
    ShoppingBag,
    AlertCircle,
    Percent,
    Award
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuthStore, useClientControllerStore } from "@/store";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/language-provider';
import '@/i18n';

// Define status mapping for consistent status names
const statusMapping = {
    "En attente": "Processing",
    "En préparation": "Processing",
    "Expédié": "Shipped",
    "Livré": "Delivered",
    "Annulé": "Cancelled"
};

// Define reverse mapping for filter comparison
const getStatusKey = (translatedStatus: string, t: any) => {
    // Create a mapping of translated values to internal status keys
    const translationToStatusMap: Record<string, string> = {
        [t('processing')]: "Processing",
        [t('shipped')]: "Shipped",
        [t('delivered')]: "Delivered",
        [t('cancelled')]: "Cancelled"
    };
    
    // Return the mapped status or the original if not found
    return translationToStatusMap[translatedStatus] || translatedStatus;
};

export default function OrderHistoryPage() {
    // Initialize i18n translation
    const { t } = useTranslation(['orders', 'common', 'dashboard']);
    const { language } = useLanguage();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(5);
    const [selectedTimeframe, setSelectedTimeframe] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    // Get user from auth store
    const { user } = useAuthStore();

    // Get purchase history data and methods from clientController store
    const {
        purchaseHistory,
        fetchPurchaseHistory,
        downloadInvoice,
        isLoading,
        error,
        clearError
    } = useClientControllerStore();

    // Fetch purchase history when the component mounts
    useEffect(() => {
        fetchPurchaseHistory();
    }, [fetchPurchaseHistory]);
    
    // Set initial values for filters after translations are loaded
    useEffect(() => {
        setSelectedTimeframe(t('allOrders'));
        setSelectedStatus(t('allStatuses'));
    }, [t]);

    // Format status for consistent display
    const getDisplayStatus = (status: string) => {
        return statusMapping[status as keyof typeof statusMapping] || status;
    };

    // Filter orders based on search query, selected timeframe and status
    const filteredOrders = purchaseHistory.filter((order) => {
        // Filter by search query
        const searchMatch = order.id.toString().includes(searchQuery.toLowerCase()) ||
            order.produits.some((item) =>
                item.designation.toLowerCase().includes(searchQuery.toLowerCase())
            );

        // Filter by status
        const statusMatch = selectedStatus === t('allStatuses') ||
            getStatusKey(getDisplayStatus(order.statutLivraison), t) === getStatusKey(selectedStatus, t);

        // Filter by timeframe
        let timeframeMatch = true;
        if (selectedTimeframe !== t('allOrders')) {
            const orderDate = new Date(order.date);
            const now = new Date();

            if (selectedTimeframe === t('last30Days')) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                timeframeMatch = orderDate >= thirtyDaysAgo;
            } else if (selectedTimeframe === t('last3Months')) {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                timeframeMatch = orderDate >= threeMonthsAgo;
            } else if (selectedTimeframe === t('last6Months')) {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(now.getMonth() - 6);
                timeframeMatch = orderDate >= sixMonthsAgo;
            }
        }

        return searchMatch && statusMatch && timeframeMatch;
    });

    const toggleOrderExpansion = (orderId: number) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    // Function to format date from the API
    const formatOrderDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM d, yyyy");
        } catch (e) {
            return dateString; // Return as is if there's a formatting issue
        }
    };

    // Handle invoice download
    const handleDownloadInvoice = (orderId: number) => {
        downloadInvoice(orderId);
    };

    // Define timeframes and statuses with translation keys
const getTimeframes = (t: any) => [
    t('allOrders'),
    t('last30Days'),
    t('last3Months'), 
    t('last6Months')
];

const getStatuses = (t: any) => [
    t('allStatuses'),
    t('delivered'),
    t('processing'),
    t('shipped'),
    t('cancelled')
];

// Get timeframes and statuses with translations
const timeframes = getTimeframes(t);
const statuses = getStatuses(t);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pt-16">
            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                    <ProfileSidebar />

                    <div className="flex-1 space-y-6 sm:space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                                    {t('title')}
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    {t('subtitle')}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 xs:gap-3 mt-3 sm:mt-0">
                                <Button variant="outline" className="gap-1 xs:gap-2 w-full xs:w-auto text-xs sm:text-sm py-1.5 h-auto sm:h-10">
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="whitespace-nowrap">{t('printInvoice')}</span>
                                </Button>
                                <Button className="gap-1 xs:gap-2 w-full xs:w-auto text-xs sm:text-sm py-1.5 h-auto sm:h-10">
                                    <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="whitespace-nowrap">{t('browseProducts', { ns: 'dashboard' })}</span>
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6">
                            {/* Search and Filter Section */}
                            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('searchOrders')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-full h-10"
                                    />
                                </div>
                                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full">
                                    <div className="relative flex-1 min-w-0">
                                        <select
                                            className="bg-muted/50 border border-muted rounded-md px-3 py-2 pr-8 text-sm w-full appearance-none h-10"
                                            value={selectedTimeframe}
                                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                                        >
                                            {timeframes.map((timeframe) => (
                                                <option key={timeframe} value={timeframe}>
                                                    {timeframe}
                                                </option>
                                            ))}
                                        </select>
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1 min-w-0">
                                        <select
                                            className="bg-muted/50 border border-muted rounded-md px-3 py-2 pr-8 text-sm w-full appearance-none h-10"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            {statuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Section */}
                            <Tabs defaultValue="all" className="mb-4 sm:mb-6">
                                <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 w-full text-xs sm:text-sm">
                                    <TabsTrigger value="all">{t('allOrders')}</TabsTrigger>
                                    <TabsTrigger value="processing">{t('processing')}</TabsTrigger>
                                    <TabsTrigger value="shipped">{t('shipped')}</TabsTrigger>
                                    <TabsTrigger value="delivered">{t('delivered')}</TabsTrigger>
                                </TabsList>

                                {isLoading ? (
                                    <div className="p-12 text-center">
                                        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                        </div>
                                        <h2 className="text-2xl font-semibold mb-2">{t('loading')}</h2>
                                    </div>
                                ) : error ? (
                                    <div className="p-12 text-center">
                                        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                            <AlertCircle className="h-8 w-8 text-red-500" />
                                        </div>
                                        <h2 className="text-2xl font-semibold mb-2">{t('error')}</h2>
                                        <p className="text-muted-foreground mb-6">{error}</p>
                                        <Button onClick={() => { clearError(); fetchPurchaseHistory(); }}>{t('tryAgain')}</Button>
                                    </div>
                                ) : (
                                    <>
                                        <TabsContent value="all" className="mt-0">
                                            <div className="space-y-6">
                                                {filteredOrders.length > 0 ? (
                                                    // Get current orders for pagination
                                                    filteredOrders
                                                        .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                                                        .map((order, index) => (
                                                        <motion.div
                                                            key={order.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                        >
                                                            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                                                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-4 sm:p-6">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
                                                                            <div className="flex items-center gap-3 w-full">
                                                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                                                                                    <Package className="h-5 w-5 text-primary" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                        <h3 className="text-lg font-semibold truncate">{t('orderNumber')}{order.id}</h3>
                                                                                        <div className="flex items-center gap-2 sm:hidden">
                                                                                            <p className="font-bold">{order.montantTotal.toFixed(2)} TND</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                                                                        <Badge
                                                                                            variant={
                                                                                                getDisplayStatus(order.statutLivraison) === "Delivered"
                                                                                                    ? "default"
                                                                                                    : getDisplayStatus(order.statutLivraison) === "Processing"
                                                                                                        ? "secondary"
                                                                                                        : "outline"
                                                                                            }
                                                                                            className="max-w-fit text-xs"
                                                                                        >
                                                                                            {order.statutLivraison}
                                                                                        </Badge>
                                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                                                            <span className="truncate">{formatOrderDate(order.date)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="hidden sm:flex flex-col items-end">
                                                                            <p className="text-xl font-bold">{order.montantTotal.toFixed(2)} TND</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {order.produits.length} {order.produits.length === 1 ? "article" : "articles"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                            {order.detailsLivraison?.dateLivraison ? (
                                                                                <span className="text-sm text-muted-foreground truncate">
                                                                                    Livré le {formatOrderDate(order.detailsLivraison.dateLivraison)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-sm text-muted-foreground truncate">
                                                                                    Commandé le {formatOrderDate(order.date)}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-muted-foreground sm:hidden ml-auto">
                                                                                {order.produits.length} {order.produits.length === 1 ? "article" : "articles"}
                                                                            </span>
                                                                        </div>
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="gap-1 w-full sm:w-auto justify-center sm:justify-start mt-2 sm:mt-0 text-xs sm:text-sm py-1 h-8"
                                                                                onClick={() => toggleOrderExpansion(order.id)}
                                                                            >
                                                                                {expandedOrder === order.id ? t('hideDetails') : t('viewDetails')}
                                                                                <ChevronDown
                                                                                    className={`h-4 w-4 transition-transform ${
                                                                                        expandedOrder === order.id ? "rotate-180" : ""
                                                                                    }`}
                                                                                />
                                                                            </Button>
                                                                    </div>
                                                                    {expandedOrder === order.id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: "auto" }}
                                                                            transition={{ duration: 0.3 }}
                                                                            className="mt-6 pt-6 border-t"
                                                                        >
                                                                            <div className="space-y-6">
                                                                                {order.produits.map((item) => (
                                                                                    <div
                                                                                        key={item.id}
                                                                                        className="flex flex-col sm:flex-row gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-colors"
                                                                                    >
                                                                                        <div className="w-full sm:w-20 h-40 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                                                            {item.image ? (
                                                                                                <img
                                                                                                    src={item.image}
                                                                                                    alt={item.designation}
                                                                                                    className="w-full h-full object-cover"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                                                                <h4 className="font-medium">{item.designation}</h4>
                                                                                                <div className="text-right mt-2 sm:mt-0">
                                                                                                    <p className="font-medium">{item.prixUnitaire.toFixed(2)} TND</p>
                                                                                                    {item.prixOriginal && item.prixOriginal > item.prixUnitaire && (
                                                                                                        <p className="text-sm text-muted-foreground line-through">
                                                                                                            {item.prixOriginal.toFixed(2)} TND
                                                                                                        </p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap items-center justify-between mt-2">
                                                                                                <p className="text-sm text-muted-foreground">
                                                                                                    Quantité: {item.quantite}
                                                                                                </p>
                                                                                                <p className="text-sm text-muted-foreground">Par unité</p>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-3 mt-2">
                                                                                                {item.remiseAppliquee > 0 && (
                                                                                                    <div className="flex items-center gap-1 text-green-500 text-sm">
                                                                                                        <Percent className="h-3 w-3" />
                                                                                                        <span>-{item.remiseAppliquee}% de remise</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {item.points > 0 && (
                                                                                                    <div className="flex items-center gap-1 text-blue-500 text-sm">
                                                                                                        <Award className="h-3 w-3" />
                                                                                                        <span>+{item.points} points</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className="mt-6 pt-6 border-t grid sm:grid-cols-2 gap-6">
                                                                                <div>
                                                                                    <h4 className="font-medium mb-3">Informations de livraison</h4>
                                                                                    {order.detailsLivraison ? (
                                                                                        <>
                                                                                            <div className="flex items-center gap-2 text-sm mb-2">
                                                                                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                                <span className="text-muted-foreground truncate">
                                                                                    {order.detailsLivraison.methodeLivraison || 'Standard'} -
                                                                                    {order.detailsLivraison.numeroSuivi || 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                            {order.detailsLivraison.numeroSuivi && (
                                                                                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                                                                                    Suivre le colis
                                                                                    <ArrowRight className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                                        </>
                                                                                    ) : (
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            Informations de livraison non disponibles
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="font-medium mb-3">Résumé de la commande</h4>
                                                                                    <div className="space-y-2 text-sm">
                                                                                <div className="flex flex-wrap justify-between">
                                                                                    <span className="text-muted-foreground w-1/2 sm:w-auto">Sous-total:</span>
                                                                                    <span className="w-1/2 sm:w-auto text-right">{(order.montantTotal - order.montantLivraison).toFixed(2)} TND</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap justify-between">
                                                                                    <span className="text-muted-foreground w-1/2 sm:w-auto">Livraison:</span>
                                                                                    <span className="w-1/2 sm:w-auto text-right">{order.montantLivraison > 0 ? `${order.montantLivraison.toFixed(2)} TND` : 'Gratuit'}</span>
                                                                                </div>
                                                                                {order.remise > 0 && (
                                                                                    <div className="flex flex-wrap justify-between">
                                                                                        <span className="text-muted-foreground w-1/2 sm:w-auto">
                                                                                            Remise{order.pourcentageRemise ? ` (${order.pourcentageRemise.toFixed(1)}%)` : ''}:
                                                                                        </span>
                                                                                        <span className="text-green-500 w-1/2 sm:w-auto text-right">{order.remise.toFixed(2)} TND</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex flex-wrap justify-between font-medium pt-2 border-t">
                                                                                    <span className="w-1/2 sm:w-auto">Total:</span>
                                                                                    <span className="w-1/2 sm:w-auto text-right">{order.montantTotal.toFixed(2)} TND</span>
                                                                                </div>
                                                                            </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4 sm:gap-0">
                                                                                <div className="space-y-2 w-full sm:w-auto text-center sm:text-left">
                                                                                    {order.pointsGagnes > 0 && (
                                                                                        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                                                                                            <Receipt className="h-4 w-4 text-green-500" />
                                                                                            <span className="text-green-500">
                                                                                                +{order.pointsGagnes} points gagnés
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    {order.pointsUtilises > 0 && (
                                                                                        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                                                                                            <Receipt className="h-4 w-4 text-blue-500" />
                                                                                            <span className="text-blue-500">
                                                                                                -{order.pointsUtilises} points utilisés
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleDownloadInvoice(order.id)}
                                                                                className="w-full sm:w-auto"
                                                                            >
                                                                                <Download className="h-4 w-4 mr-2" />
                                                                                {t('downloadInvoice')}
                                                                            </Button>
                                                                            {getDisplayStatus(order.statutLivraison) === "Delivered" && (
                                                                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                                                    Retourner les articles
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Card className="p-12 text-center">
                                                            <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                                <Package className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                            <h2 className="text-2xl font-semibold mb-2">{t('noOrdersFound')}</h2>
                                                            <p className="text-muted-foreground mb-6">
                                                                {searchQuery || selectedStatus !== t('allStatuses') || selectedTimeframe !== t('allOrders')
                                                                    ? t('noOrdersMatchingCriteria')
                                                                    : t('noOrdersYet', { ns: 'dashboard' })}
                                                            </p>
                                                            {(searchQuery || selectedStatus !== t('allStatuses') || selectedTimeframe !== t('allOrders')) && (
                                                                <Button variant="outline" onClick={() => {
                                                                    setSearchQuery("");
                                                                    setSelectedStatus(t('allStatuses'));
                                                                    setSelectedTimeframe(t('allOrders'));
                                                                }}>
                                                                    {t('clearFilters')}
                                                                </Button>
                                                            )}
                                                            {!searchQuery && selectedStatus === t('allStatuses') && selectedTimeframe === t('allOrders') && (
                                                                <Button className="gap-2" asChild>
                                                                    <a href="/store">
                                                                        <ShoppingBag className="h-4 w-4" />
                                                                        {t('browseProducts', { ns: 'dashboard' })}
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </Card>
                                                    </motion.div>
                                                )}
                                                
                                                {/* Pagination Controls */}
                                                {filteredOrders.length > ordersPerPage && (
                                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t gap-4">
                                                        <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto mb-2 sm:mb-0">
                                                            {t('showingPage', { current: currentPage, total: Math.ceil(filteredOrders.length / ordersPerPage) })}
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                disabled={currentPage === 1}
                                                                className="flex-shrink-0 h-8 px-2 text-xs sm:text-sm sm:px-3"
                                                            >
                                                                {t('previous', { ns: 'common' })}
                                                            </Button>
                                                            
                                                            {/* Current page indicator for small screens */}
                                                            <div className="flex xs:hidden items-center justify-center bg-muted/30 rounded px-2 py-1 text-xs">
                                                                {currentPage} / {Math.ceil(filteredOrders.length / ordersPerPage)}
                                                            </div>
                                                            
                                                            {/* Page numbers - Hide on very small screens */}
                                                            <div className="hidden xs:flex items-center gap-1">
                                                                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / ordersPerPage)) }, (_, i) => {
                                                                    // Show pages around current page
                                                                    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
                                                                    let pageNum;
                                                                    
                                                                    if (totalPages <= 5) {
                                                                        pageNum = i + 1;
                                                                    } else if (currentPage <= 3) {
                                                                        pageNum = i + 1;
                                                                    } else if (currentPage >= totalPages - 2) {
                                                                        pageNum = totalPages - 4 + i;
                                                                    } else {
                                                                        pageNum = currentPage - 2 + i;
                                                                    }
                                                                    
                                                                    return (
                                                                        <Button 
                                                                            key={pageNum}
                                                                            variant={currentPage === pageNum ? "default" : "outline"}
                                                                            size="sm"
                                                                            className="w-8 h-8 p-0 text-xs sm:text-sm"
                                                                            onClick={() => setCurrentPage(pageNum)}
                                                                        >
                                                                            {pageNum}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                            
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredOrders.length / ordersPerPage)))}
                                                                disabled={currentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
                                                                className="flex-shrink-0 h-8 px-2 text-xs sm:text-sm sm:px-3"
                                                            >
                                                                {t('next', { ns: 'common' })}
                                                            </Button>
                                                            
                                                            {/* Items per page selector */}
                                                            <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4">
                                                                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{t('itemsPerPage')}:</span>
                                                                <select
                                                                    className="bg-muted/50 border border-muted rounded-md px-2 py-1 text-xs sm:text-sm h-8 flex-shrink-0"
                                                                    value={ordersPerPage}
                                                                    onChange={(e) => {
                                                                        setOrdersPerPage(Number(e.target.value));
                                                                        setCurrentPage(1); // Reset to first page when changing items per page
                                                                    }}
                                                                >
                                                                    {[5, 10, 20].map((value) => (
                                                                        <option key={value} value={value}>
                                                                        {value} {t('perPage', { ns: 'common' })}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="processing">
                                            <div className="space-y-6">
                                                {filteredOrders.filter(order =>
                                                    getDisplayStatus(order.statutLivraison) === "Processing"
                                                ).length > 0 ? (
                                                    filteredOrders
                                                        .filter(order => getDisplayStatus(order.statutLivraison) === "Processing")
                                                        .map((order, index) => (
                                                            // Include the full order card structure here
                                                            <motion.div
                                                                key={order.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            >
                                                                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                                                    {/* Full card contents similar to "all" tab */}
                                                                    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-4 sm:p-6">
                                                                        {/* Card contents - same structure as in "all" tab */}
                                                                        {/* ... */}
                                                                    </div>
                                                                </Card>
                                                            </motion.div>
                                                        ))
                                                ) : (
                                                    <div className="p-12 text-center">
                                                        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <Clock className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <h2 className="text-2xl font-semibold mb-2">Aucune commande en cours</h2>
                                                        <p className="text-muted-foreground mb-6">
                                                            Vous n'avez pas de commandes en cours de traitement
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="shipped">
                                            <div className="space-y-6">
                                                {filteredOrders.filter(order =>
                                                    getDisplayStatus(order.statutLivraison) === "Shipped"
                                                ).length > 0 ? (
                                                    filteredOrders
                                                        .filter(order => getDisplayStatus(order.statutLivraison) === "Shipped")
                                                        .map((order, index) => (
                                                            // Include the full order card structure here
                                                            <motion.div
                                                                key={order.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            >
                                                                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                                                    {/* Full card contents similar to "all" tab */}
                                                                    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-4 sm:p-6">
                                                                        {/* Card contents - same structure as in "all" tab */}
                                                                        {/* ... */}
                                                                    </div>
                                                                </Card>
                                                            </motion.div>
                                                        ))
                                                ) : (
                                                    <div className="p-12 text-center">
                                                        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <Package className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <h2 className="text-2xl font-semibold mb-2">Aucune commande expédiée</h2>
                                                        <p className="text-muted-foreground mb-6">
                                                            Vous n'avez pas de commandes en cours d'expédition
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="delivered">
                                            <div className="space-y-6">
                                                {filteredOrders.filter(order =>
                                                    getDisplayStatus(order.statutLivraison) === "Delivered"
                                                ).length > 0 ? (
                                                    filteredOrders
                                                        .filter(order => getDisplayStatus(order.statutLivraison) === "Delivered")
                                                        .map((order, index) => (
                                                            // Reuse the same order card component structure as above
                                                            <motion.div
                                                                key={order.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            >
                                                                {/* Order card contents (same as above) */}
                                                                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                                                    {/* Card contents would be identical to the ones in the "all" tab */}
                                                                    {/* ... */}
                                                                </Card>
                                                            </motion.div>
                                                        ))
                                                ) : (
                                                    <div className="p-12 text-center">
                                                        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <Package className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <h2 className="text-2xl font-semibold mb-2">Aucune commande livrée</h2>
                                                        <p className="text-muted-foreground mb-6">
                                                            Vous n'avez pas encore de commandes livrées
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}