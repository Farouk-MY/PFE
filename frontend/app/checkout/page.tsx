"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import {
  Truck,
  Package,
  Gift,
  ChevronRight,
  Plus,
  MapPin,
  Shield,
  Clock,
  Home,
  Store,
  AlertTriangle,
  InfoIcon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription
} from "@/components/ui/alert"
import { useCartStore, useAuthStore, useCommandeStore } from "@/store"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {Slider} from "@/components/ui/slider";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

interface FormErrors {
  address?: string;
  points?: string;
  cart?: string;
  general?: string;
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalPoints, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const { createCommande, setDeliveryOption, deliveryOption } = useCommandeStore()

  const [isLoading, setIsLoading] = useState(false)
  const [showNewAddressDialog, setShowNewAddressDialog] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [orderNotes, setOrderNotes] = useState("")
  const [userAddresses, setUserAddresses] = useState<Address[]>([])
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [errorVisible, setErrorVisible] = useState(false)
  const [addressErrorFields, setAddressErrorFields] = useState<Record<string, boolean>>({})
  const [newAddress, setNewAddress] = useState<Address>({
    id: '',
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin?redirect=/checkout')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  useEffect(() => {
    if (user) {
      const storedAddresses = localStorage.getItem('user-addresses')
      if (storedAddresses) {
        try {
          const addresses = JSON.parse(storedAddresses) as Address[]
          setUserAddresses(addresses)
          if (addresses.length > 0 && !selectedAddress) {
            const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
            setSelectedAddress(defaultAddress)
            if (deliveryOption === 'delivery') {
              setDeliveryAddress(`${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}, ${defaultAddress.country}`)
            }
          }
        } catch (e) {
          setUserAddresses([])
          toast.error('Failed to load saved addresses')
        }
      } else {
        if (user.ville || user.gouvernorat || user.codePostal) {
          const defaultAddress: Address = {
            id: 'default-address',
            name: `${user.prenom} ${user.nom}`,
            street: 'Your Street Address',
            city: user.ville || 'Your City',
            state: user.gouvernorat || 'Your State',
            zipCode: user.codePostal || 'Your ZIP Code',
            country: 'Tunisia',
            phone: user.telephone || '',
            isDefault: true
          }
          setUserAddresses([defaultAddress])
          setSelectedAddress(defaultAddress)
          if (deliveryOption === 'delivery') {
            setDeliveryAddress(`${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}, ${defaultAddress.country}`)
          }
          localStorage.setItem('user-addresses', JSON.stringify([defaultAddress]))
        }
      }
    }
  }, [user, deliveryOption, selectedAddress])

  const subtotal = getTotalPrice()
  const pointsEarned = getTotalPoints()
  const shipping = deliveryOption === 'delivery' ? (subtotal > 100 ? 0 : 5.99) : 0

  // Calculate discount based on 2000 points = 10%
  const discountBlocks = Math.floor(pointsToRedeem / 2000)
  const discountPercent = discountBlocks * 10
  const discountAmount = subtotal * (discountPercent / 100)
  const total = subtotal + shipping - discountAmount

  const validateAddressForm = () => {
    const errors: Record<string, boolean> = {}
    let isValid = true

    if (!newAddress.name.trim()) {
      errors.name = true
      isValid = false
    }

    if (!newAddress.street.trim()) {
      errors.street = true
      isValid = false
    }

    if (!newAddress.city.trim()) {
      errors.city = true
      isValid = false
    }

    if (!newAddress.state.trim()) {
      errors.state = true
      isValid = false
    }

    if (!newAddress.zipCode.trim()) {
      errors.zipCode = true
      isValid = false
    }

    if (!newAddress.phone.trim()) {
      errors.phone = true
      isValid = false
    }

    setAddressErrorFields(errors)
    return isValid
  }

  const handleAddAddress = () => {
    if (!validateAddressForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    const uniqueId = Math.random().toString(36).substr(2, 9)
    const address: Address = {
      ...newAddress,
      id: uniqueId,
      isDefault: userAddresses.length === 0,
    }

    try {
      const updatedAddresses = [...userAddresses, address]
      setUserAddresses(updatedAddresses)
      setSelectedAddress(address)

      localStorage.setItem('user-addresses', JSON.stringify(updatedAddresses))

      if (deliveryOption === 'delivery') {
        setDeliveryAddress(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`)
      }

      setShowNewAddressDialog(false)
      toast.success('Address added successfully')

      // Clear form errors for address
      setFormErrors({...formErrors, address: undefined})
    } catch (error) {
      toast.error('Failed to save address. Please try again.')
    }
  }

  const handleDeliveryOptionChange = (value: 'pickup' | 'delivery') => {
    setDeliveryOption(value)

    if (value === 'delivery' && selectedAddress) {
      setDeliveryAddress(`${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}, ${selectedAddress.country}`)
    } else {
      setDeliveryAddress("")
    }

    // Clear address errors when changing delivery option
    if (value === 'pickup') {
      setFormErrors({...formErrors, address: undefined})
    }
  }

  const validatePointsToRedeem = () => {
    const maxPoints = Math.min(user?.soldePoints || 0, Math.floor(subtotal / 0.1) * 2000)

    if (pointsToRedeem < 0) {
      setPointsToRedeem(0)
      setFormErrors({...formErrors, points: 'Points cannot be negative'})
      return false
    }

    if (pointsToRedeem > maxPoints) {
      setPointsToRedeem(maxPoints)
      setFormErrors({...formErrors, points: `Maximum points you can redeem: ${maxPoints}`})
      return false
    }

    if (pointsToRedeem % 2000 !== 0 && pointsToRedeem > 0) {
      setPointsToRedeem(Math.floor(pointsToRedeem / 2000) * 2000)
      setFormErrors({...formErrors, points: 'Points must be in multiples of 2000'})
      return false
    }

    // Clear points error
    setFormErrors({...formErrors, points: undefined})
    return true
  }

  const handleCheckout = async () => {
    setErrorVisible(false)
    const errors: FormErrors = {}

    if (items.length === 0) {
      errors.cart = 'Your cart is empty'
      toast.error(errors.cart)
      router.push('/cart')
      return
    }

    if (deliveryOption === 'delivery' && !selectedAddress) {
      errors.address = 'Please select a shipping address'
      toast.error(errors.address)
      setFormErrors(errors)
      setErrorVisible(true)
      return
    }

    if (!validatePointsToRedeem()) {
      setErrorVisible(true)
      return
    }

    setIsLoading(true)

    try {
      if (!total || total < 0) {
        throw new Error('Invalid order total. Please try again.')
      }

      const order = await createCommande(
          pointsToRedeem > 0,
          pointsToRedeem,
          'espece',
          deliveryOption,
          deliveryAddress
      )

      toast.success('Order placed successfully!')
      clearCart()
      router.push(`http://localhost:3000/checkout/result?status=success&id=${order.id}`)
    } catch (error: any) {
      const errorMessage = encodeURIComponent(error.message || 'Failed to place order. Please try again.')
      toast.error(error.message || 'Failed to place order. Please try again.')
      setFormErrors({...formErrors, general: error.message || 'Failed to place order. Please try again.'})
      setErrorVisible(true)
      router.push(`http://localhost:3000/checkout/result?status=failed&error=${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || items.length === 0) {
    return null
  }

  return (
      <TooltipProvider>
        <div className="min-h-screen py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-8">Checkout</h1>

              {errorVisible && Object.values(formErrors).some(error => !!error) && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {formErrors.general || formErrors.address || formErrors.points || formErrors.cart}
                    </AlertDescription>
                  </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold">Delivery Options</h2>
                    </div>

                    <RadioGroup
                        value={deliveryOption}
                        onValueChange={(value: any) => handleDeliveryOptionChange(value)}
                        className="space-y-4"
                    >
                      <div
                          className={`flex items-start space-x-4 p-4 rounded-lg border ${
                              deliveryOption === 'pickup'
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                          }`}
                      >
                        <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <label
                                htmlFor="pickup"
                                className="font-medium cursor-pointer flex items-center"
                            >
                              <Store className="mr-2 h-4 w-4" />
                              Store Pickup
                            </label>
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Free</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Collect your order from our store
                          </p>
                        </div>
                      </div>

                      <div
                          className={`flex items-start space-x-4 p-4 rounded-lg border ${
                              deliveryOption === 'delivery'
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                          }`}
                      >
                        <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <label
                                htmlFor="delivery"
                                className="font-medium cursor-pointer flex items-center"
                            >
                              <Home className="mr-2 h-4 w-4" />
                              Home Delivery
                            </label>
                            {shipping === 0 ? (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Free</span>
                            ) : (
                                <span className="ml-2 text-xs">{shipping.toFixed(3)} TND</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Deliver to your address (Free for orders over 100 TND)
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </Card>

                  {deliveryOption === 'delivery' && (
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold">Shipping Address</h2>
                          </div>
                          <Dialog open={showNewAddressDialog} onOpenChange={setShowNewAddressDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Address</DialogTitle>
                                <DialogDescription>
                                  Enter your shipping address details below.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name" className="flex">
                                      Name
                                      <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newAddress.name}
                                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                        className={addressErrorFields.name ? "border-red-500" : ""}
                                    />
                                    {addressErrorFields.name && (
                                        <p className="text-red-500 text-xs mt-1">Name is required</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex">
                                      Phone
                                      <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={newAddress.phone}
                                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        className={addressErrorFields.phone ? "border-red-500" : ""}
                                    />
                                    {addressErrorFields.phone && (
                                        <p className="text-red-500 text-xs mt-1">Phone is required</p>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="street" className="flex">
                                    Street Address
                                    <span className="text-red-500 ml-1">*</span>
                                  </Label>
                                  <Input
                                      id="street"
                                      value={newAddress.street}
                                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                      className={addressErrorFields.street ? "border-red-500" : ""}
                                  />
                                  {addressErrorFields.street && (
                                      <p className="text-red-500 text-xs mt-1">Street address is required</p>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="city" className="flex">
                                      City
                                      <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="city"
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        className={addressErrorFields.city ? "border-red-500" : ""}
                                    />
                                    {addressErrorFields.city && (
                                        <p className="text-red-500 text-xs mt-1">City is required</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="state" className="flex">
                                      State
                                      <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="state"
                                        value={newAddress.state}
                                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                        className={addressErrorFields.state ? "border-red-500" : ""}
                                    />
                                    {addressErrorFields.state && (
                                        <p className="text-red-500 text-xs mt-1">State is required</p>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="zipCode" className="flex">
                                      ZIP Code
                                      <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="zipCode"
                                        value={newAddress.zipCode}
                                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                        className={addressErrorFields.zipCode ? "border-red-500" : ""}
                                    />
                                    {addressErrorFields.zipCode && (
                                        <p className="text-red-500 text-xs mt-1">ZIP code is required</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={newAddress.country || 'Tunisia'}
                                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleAddAddress}>Add Address</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {formErrors.address && userAddresses.length === 0 && (
                            <Alert variant="destructive" className="mb-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Please add a shipping address
                              </AlertDescription>
                            </Alert>
                        )}

                        <RadioGroup
                            value={selectedAddress?.id}
                            onValueChange={(value) => {
                              const address = userAddresses.find(addr => addr.id === value)
                              if (address) {
                                setSelectedAddress(address)
                                setDeliveryAddress(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`)
                                // Clear address error when an address is selected
                                setFormErrors({...formErrors, address: undefined})
                              }
                            }}
                            className="space-y-4"
                        >
                          {userAddresses.length === 0 ? (
                              <div className="text-center p-8 border border-dashed rounded-lg">
                                <p className="text-muted-foreground mb-4">No addresses found</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewAddressDialog(true)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add New Address
                                </Button>
                              </div>
                          ) : (
                              userAddresses.map((address) => (
                                  <div
                                      key={address.id}
                                      className={`flex items-start space-x-4 p-4 rounded-lg border ${
                                          selectedAddress?.id === address.id
                                              ? 'border-primary bg-primary/5'
                                              : 'hover:bg-muted/50'
                                      }`}
                                  >
                                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <label
                                            htmlFor={address.id}
                                            className="font-medium cursor-pointer"
                                        >
                                          {address.name}
                                        </label>
                                        {address.isDefault && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Default
                                </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {address.street}
                                        <br />
                                        {address.city}, {address.state} {address.zipCode}
                                        <br />
                                        {address.country}
                                        <br />
                                        {address.phone}
                                      </p>
                                    </div>
                                  </div>
                              ))
                          )}
                        </RadioGroup>
                      </Card>
                  )}

                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <h2 className="text-lg font-semibold">Payment Method</h2>
                    </div>
                    <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-amber-500 mr-3 flex items-center justify-center text-white text-xs">✓</div>
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-emerald-600" />
                      <h2 className="text-lg font-semibold">Order Notes</h2>
                    </div>
                    <Textarea
                        placeholder="Add any special instructions for your order..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="resize-none"
                    />
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                      {items.length === 0 ? (
                          <Alert className="mb-4">
                            <InfoIcon className="h-4 w-4" />
                            <AlertDescription>
                              Your cart is empty. Please add items to proceed.
                            </AlertDescription>
                          </Alert>
                      ) : (
                          <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium line-clamp-1">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Quantity: {item.quantity}
                                    </p>
                                    <p className="font-medium mt-1">
                                      {(item.price * item.quantity).toFixed(3)} TND
                                    </p>
                                  </div>
                                </div>
                            ))}
                          </div>
                      )}

                      <Separator className="my-6" />

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{subtotal.toFixed(3)} TND</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Shipping</span>
                          {shipping === 0 ? (
                              <span className="text-green-600 font-medium">Free</span>
                          ) : (
                              <span>{shipping.toFixed(3)} TND</span>
                          )}
                        </div>
                        {discountPercent > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount ({discountPercent}%)</span>
                              <span>-{discountAmount.toFixed(3)} TND</span>
                            </div>
                        )}
                      </div>

                      <Separator className="my-6" />

                      <div className="flex justify-between text-lg font-bold mb-6">
                        <span>Total</span>
                        <span>{total.toFixed(3)} TND</span>
                      </div>

                      <div className="bg-primary/5 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Reward Points</h3>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Available Points</span>
                            <span>{user?.soldePoints || 0}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Points to Earn</span>
                            <span>+{pointsEarned}</span>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-1">
                              <Label htmlFor="redeemPoints" className="text-xs flex items-center">
                                Points to Redeem
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>2000 points = 10% discount</p>
                                    <p>4000 points = 20% discount</p>
                                    <p>Points must be in multiples of 2000</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <span className="text-xs text-muted-foreground">
                                Available: {user?.soldePoints || 0}
                              </span>
                            </div>
                            <Slider
                                id="redeemPoints"
                                min={0}
                                max={Math.min(user?.soldePoints || 0, Math.floor(subtotal / 0.1) * 2000)}
                                step={2000}
                                value={[pointsToRedeem]}
                                onValueChange={(value) => {
                                  const newValue = value[0];
                                  setPointsToRedeem(newValue);
                                  const maxPoints = Math.min(user?.soldePoints || 0, Math.floor(subtotal / 0.1) * 2000);

                                  if (newValue < 0) {
                                    setFormErrors({ ...formErrors, points: "Points cannot be negative" });
                                  } else if (newValue > maxPoints) {
                                    setFormErrors({ ...formErrors, points: `Maximum points you can redeem: ${maxPoints}` });
                                  } else if (newValue % 2000 !== 0 && newValue > 0) {
                                    setFormErrors({ ...formErrors, points: "Points must be in multiples of 2000" });
                                  } else {
                                    setFormErrors({ ...formErrors, points: undefined });
                                  }
                                }}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Points: {pointsToRedeem}</span>
                              <span>Discount: {discountPercent}%</span>
                            </div>
                            {formErrors.points ? (
                                <p className="text-red-500 text-xs mt-1">{formErrors.points}</p>
                            ) : pointsToRedeem > 0 ? (
                                <div className="flex items-center mt-2 bg-primary/10 text-primary rounded-md p-2 text-xs">
                                  <Gift className="h-3 w-3 mr-1" />
                                  <span>
            {pointsToRedeem} points = {discountPercent}% discount (-{discountAmount.toFixed(3)} TND)
          </span>
                                </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={isLoading || items.length === 0}
                        >
                          {isLoading ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </div>
                          ) : (
                              <div className="flex items-center">
                                Place Order
                                <ChevronRight className="ml-2 h-5 w-5" />
                              </div>
                          )}
                        </Button>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span>Secure checkout with cash on delivery</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
  )
}