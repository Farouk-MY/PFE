"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import CheckoutStatus from '@/components/CheckoutStatus'
import { useCommandeStore, useCartStore } from '@/store'
import { Loader2 } from 'lucide-react'
import DOMPurify from 'dompurify'

export default function CheckoutResultPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [orderStatus, setOrderStatus] = useState<'success' | 'failed' | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const { currentCommande, getCommandeDetails } = useCommandeStore()
    const { clearCart } = useCartStore()

    useEffect(() => {
        const status = searchParams.get('status')
        const id = searchParams.get('id')
        const error = searchParams.get('error')

        const verifyOrder = async () => {
            setIsLoading(true)

            try {
                if (status === 'success' && id) {
                    const numericId = parseInt(id)

                    if (!isNaN(numericId)) {
                        const orderDetails = await getCommandeDetails(numericId)

                        if (orderDetails) {
                            setOrderStatus('success')
                            setOrderId(id)
                            clearCart()
                        } else {
                            throw new Error('Order details could not be retrieved')
                        }
                    } else {
                        throw new Error('Invalid order ID')
                    }
                } else if (status === 'failed') {
                    setOrderStatus('failed')
                    // Ensure error message is properly decoded and displayed
                    const decodedError = error ? decodeURIComponent(error) : null
                    setErrorMessage(decodedError ? DOMPurify.sanitize(decodedError) : "There was a problem processing your order. Please try again.")
                } else {
                    router.push('/')
                }
            } catch (err: any) {
                console.error('Error verifying order:', err)
                setOrderStatus('failed')
                setErrorMessage(DOMPurify.sanitize(err.message || "There was a problem verifying your order."))
            } finally {
                setIsLoading(false)
            }
        }

        verifyOrder()
    }, [searchParams, getCommandeDetails, clearCart, router])

    const handleRetry = () => {
        router.push('/checkout')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                    <h2 className="text-xl font-medium">Verifying your order...</h2>
                    <p className="text-muted-foreground mt-2">Please wait while we confirm your purchase</p>
                </div>
            </div>
        )
    }

    if (!orderStatus) {
        return null
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <CheckoutStatus
                status={orderStatus}
                orderId={orderId || undefined}
                errorMessage={errorMessage || undefined}
                onRetry={handleRetry}
            />
        </div>
    )
}