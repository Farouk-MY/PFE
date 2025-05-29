"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProductPageClient from '@/components/ProductPageClient';
import {ClientProduct, useClientControllerStore} from '@/store';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ProductPage() {
    // Get the productId from URL params
    const params = useParams();
    const productId = parseInt(params.id as string);

    const {
        fetchProductById,
        selectedProduct,
        isLoading,
        error
    } = useClientControllerStore();

    // Use useEffect for data fetching
    useEffect(() => {
        if (productId) {
            fetchProductById(productId);
        }
    }, [productId, fetchProductById]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <LoadingSpinner />
                <p className="mt-4 text-muted-foreground">Loading product details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-bold mb-4">Error</h2>
                <p className="text-muted-foreground mb-8">{error}</p>
                <a href="/" className="btn">
                    Return to Home
                </a>
            </div>
        );
    }

    if (!selectedProduct) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
                <p className="text-muted-foreground mb-8">
                    Sorry, we couldn't find the product you're looking for.
                </p>
                <a href="/" className="btn">
                    Return to Home
                </a>
            </div>
        );
    }

    return <ProductPageClient product={selectedProduct as ClientProduct} />;
}