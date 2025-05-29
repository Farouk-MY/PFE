"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore, useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2, ShoppingBag, Truck, ArrowRight, Gift, Info } from 'lucide-react'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from '@/components/ui/badge'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalPoints } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [animateItems, setAnimateItems] = useState(false)

  const subtotal = getTotalPrice()
  const shipping = subtotal > 100 ? 0 : 5.99
  const pointsToEarn = getTotalPoints()
  const total = subtotal + shipping

  useEffect(() => {
    setAnimateItems(true)
  }, [])

  if (items.length === 0) {
    return (
        <div className="pt-24 sm:pt-32 pb-16 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center relative">
          <div className="text-center max-w-md mx-auto bg-card dark:bg-slate-800/60 p-8 rounded-2xl shadow-lg dark:shadow-slate-900/30 border border-slate-200 dark:border-slate-700">
            <div className="mb-6 bg-primary/10 dark:bg-primary/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild size="lg" className="rounded-full px-8 py-6 transition-all hover:scale-105">
              <Link href="/store">Discover Products</Link>
            </Button>
          </div>
        </div>
    )
  }

  return (
      <div className="relative">
        <div className="h-24 sm:h-32"></div>

        <div className="container mx-auto px-4 pb-16 relative">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-primary dark:to-indigo-400">
              Your Shopping Cart
            </h1>
            <span className="text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item, index) => (
                    <Card
                        key={item.id}
                        className={`p-6 border border-slate-200 dark:border-slate-700 hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-300 hover:shadow-md dark:hover:shadow-slate-800/30 ${
                            animateItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{
                          transitionDelay: `${index * 100}ms`,
                          borderRadius: '16px'
                        }}
                    >
                      <div className="flex gap-6">
                        <div className="w-32 h-32 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="font-bold text-lg">{item.price.toFixed(3)} TND</p>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            SKU: {typeof item.id === 'string' ? item.id.substring(0, 8) : `ITEM-${index}`}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Gift className="h-3 w-3 mr-1" />
                              {item.points * item.quantity} points
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ≈ {(item.points * item.quantity * 0.01).toFixed(3)} TND value
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-6">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-8 w-8 dark:text-slate-300 dark:hover:text-white"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center border-0 bg-transparent focus-visible:ring-0 dark:text-white"
                              />
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-8 w-8 dark:text-slate-300 dark:hover:text-white"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive dark:hover:text-red-400 ml-auto"
                                onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            </div>

            <div>
              <Card className="p-8 sticky top-36 rounded-3xl border dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-xl dark:shadow-slate-900/30">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{subtotal.toFixed(3)} TND</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-muted-foreground">Shipping</span>
                      {shipping === 0 && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">Free</span>
                      )}
                    </div>
                    <span>{shipping === 0 ? '0.000 TND' : `${shipping.toFixed(3)} TND`}</span>
                  </div>

                  {subtotal < 100 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm mt-2">
                        <p className="text-amber-800 dark:text-amber-400">Add <strong>{(100 - subtotal).toFixed(3)} TND</strong> more to qualify for free shipping</p>
                        <div className="w-full bg-amber-200 dark:bg-amber-700/30 rounded-full h-1.5 mt-2">
                          <div
                              className="bg-amber-500 dark:bg-amber-500/70 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, subtotal)}%` }}
                          ></div>
                        </div>
                      </div>
                  )}

                  {isAuthenticated && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <Gift className="h-4 w-4" />
                          <p className="text-sm font-medium">Points to Earn: {pointsToEarn}</p>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          ≈ {(pointsToEarn * 0.01).toFixed(3)} TND value
                        </p>
                      </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span>Total</span>
                      <span>{total.toFixed(3)} TND</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Tax and discounts calculated at checkout</p>
                  </div>

                  <Button
                      className="w-full mt-6 rounded-full py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 dark:shadow-primary/20"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/auth/signin?redirect=/checkout')
                        } else {
                          router.push('/checkout')
                        }
                      }}
                  >
                    {isAuthenticated ? (
                        <>
                          Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    ) : (
                        'Sign in to Checkout'
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-3 mt-4">
                    <Button variant="ghost" asChild className="text-sm">
                      <Link href="/store">Continue Shopping</Link>
                    </Button>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>Free delivery on orders over 100 TND</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}