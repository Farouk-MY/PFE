"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Image, X, Loader2 } from 'lucide-react'
import { Product, useAdminControllerStore } from '@/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import '@/i18n'

interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSuccess?: () => void;
}

export function ProductModal({ open, onOpenChange, product, onSuccess }: ProductModalProps) {
    // Initialize i18n translation
    const { t } = useTranslation(['products', 'common']);
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<string[]>([])
    const [dragActive, setDragActive] = useState(false)
    const { toast } = useToast()

    // Get functions and data from adminController
    const {
        categories,
        getAllCategories,
        createProduct,
        updateProduct,
        error,
        clearError
    } = useAdminControllerStore()

    const [formData, setFormData] = useState({
        designation: '',
        description: '',
        prix: 0,
        qteStock: 0,
        seuilMin: 0,
        nbrPoint: 0,
        categoryId: '',
        images: [] as File[],
        existingImages: [] as string[]
    })

    const [errors, setErrors] = useState({
        designation: '',
        description: '',
        prix: '',
        qteStock: '',
        seuilMin: '',
        nbrPoint: '',
        categoryId: ''
    })

    useEffect(() => {
        // Load categories when the modal opens
        if (open) {
            getAllCategories()
        }
    }, [open, getAllCategories])

    // Watch for API errors
    useEffect(() => {
        if (error) {
            toast({
                title: t('common:error'),
                description: error,
                variant: "destructive",
            })
            clearError()
            setIsSubmitting(false)
        }
    }, [error, toast, clearError])

    // In product-modal.tsx, update the useEffect for product changes
    useEffect(() => {
        if (product) {
            // Make sure we're capturing the full product image data
            const productImages = product.images || [];

            setFormData({
                designation: product.designation,
                description: product.description || '',
                prix: product.prix,
                qteStock: product.qteStock,
                seuilMin: product.seuilMin,
                nbrPoint: product.nbrPoint,
                categoryId: product.categoryId?.toString() || '',
                images: [], // New images to upload
                existingImages: [...productImages] // Clone the array to avoid reference issues
            });

            if (productImages.length > 0) {
                setExistingImages([...productImages]);
                setPreviewImages([...productImages]);
            } else {
                setExistingImages([]);
                setPreviewImages([]);
            }
        } else {
            // Reset for new product creation
            setFormData({
                designation: '',
                description: '',
                prix: 0,
                qteStock: 0,
                seuilMin: 0,
                nbrPoint: 0,
                categoryId: '',
                images: [],
                existingImages: []
            });
            setExistingImages([]);
            setPreviewImages([]);
        }

        setErrors({
            designation: '',
            description: '',
            prix: '',
            qteStock: '',
            seuilMin: '',
            nbrPoint: '',
            categoryId: ''
        });
    }, [product, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target

        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: parseFloat(value) || 0
            })
        } else {
            setFormData({
                ...formData,
                [name]: value
            })
        }

        if (name in errors) {
            setErrors({
                ...errors,
                [name]: ''
            })
        }
    }

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, categoryId: value }))
        setErrors(prev => ({ ...prev, categoryId: '' }))
    }

    const validateForm = () => {
        const newErrors = {
            designation: '',
            description: '',
            prix: '',
            qteStock: '',
            seuilMin: '',
            nbrPoint: '',
            categoryId: ''
        }

        let isValid = true

        if (!formData.designation.trim()) {
            newErrors.designation = t('products:productNameRequired')
            isValid = false
        } else if (formData.designation.length > 100) {
            newErrors.designation = t('products:productNameTooLong')
            isValid = false
        }

        if (!formData.description.trim()) {
            newErrors.description = t('products:descriptionRequired')
            isValid = false
        }

        if (formData.prix < 0) {
            newErrors.prix = t('products:pricePositive')
            isValid = false
        }

        if (formData.qteStock < 0) {
            newErrors.qteStock = t('products:stockPositive')
            isValid = false
        }

        if (formData.seuilMin < 0) {
            newErrors.seuilMin = t('products:minStockPositive')
            isValid = false
        }

        if (formData.nbrPoint < 0) {
            newErrors.nbrPoint = t('products:fidelityPointsPositive')
            isValid = false
        }


        if (!formData.categoryId) {
            newErrors.categoryId = t('products:categoryRequired')
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const apiFormData = new FormData();
            apiFormData.append('designation', formData.designation);
            apiFormData.append('description', formData.description);
            apiFormData.append('prix', formData.prix.toString());
            apiFormData.append('qteStock', formData.qteStock.toString());
            apiFormData.append('seuilMin', formData.seuilMin.toString());
            apiFormData.append('nbrPoint', formData.nbrPoint.toString());
            apiFormData.append('categoryId', formData.categoryId);

            // Add new images if any are selected
            if (formData.images && formData.images.length > 0) {
                for (let i = 0; i < formData.images.length; i++) {
                    apiFormData.append('images', formData.images[i]);
                }
            }

            // CRITICAL: Always include existingImages in update operations
            // This way the backend knows which images to keep
            if (product) {
                // Ensure we're sending the current state of existing images as a JSON string
                apiFormData.append('existingImages', JSON.stringify(existingImages));

                // For debugging - log what we're sending
                console.log("Sending existingImages:", existingImages);
            }

            // Call the API
            let result;
            if (product) {
                result = await updateProduct(product.id, apiFormData);
            } else {
                result = await createProduct(apiFormData);
            }

            if (result) {
                toast({
                    title: product ? t('products:productUpdated') : t('products:productCreated'),
                description: t('products:successMessage', { action: product ? t('common:updated') : t('common:created'), name: formData.designation }),
                });
                onOpenChange(false);
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${product ? 'update' : 'create'} product`,
                variant: "destructive",
            });
            console.error("Error submitting product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }

    const handleFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)
            const isValidSize = file.size <= 2 * 1024 * 1024 // 2MB
            return isValidType && isValidSize
        })

        if (validFiles.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...validFiles]
            }))

            const newPreviews = validFiles.map(file => URL.createObjectURL(file))
            setPreviewImages(prev => [...prev, ...newPreviews])
        }
    }

    const removeImage = (index: number) => {
        if (product && index < existingImages.length) {
            // Remove from existing images
            const updatedExistingImages = [...existingImages]
            updatedExistingImages.splice(index, 1)
            setExistingImages(updatedExistingImages)

            // Remove from preview images
            setPreviewImages(prev => {
                const updated = [...prev]
                updated.splice(index, 1)
                return updated
            })
        } else {
            // Remove from newly added images
            const newImageIndex = product ? index - existingImages.length : index
            const updatedImages = [...formData.images]
            updatedImages.splice(newImageIndex, 1)

            setFormData(prev => ({
                ...prev,
                images: updatedImages
            }))

            // Remove from preview images
            setPreviewImages(prev => {
                const updated = [...prev]
                updated.splice(index, 1)
                return updated
            })
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? t('products:editProduct') : t('products:addProduct')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="designation">{t('products:productName')}</Label>
                            <Input
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleInputChange}
                            />
                            {errors.designation && (
                                <p className="text-sm text-red-500 mt-1">{errors.designation}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">{t('products:description')}</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="categoryId">{t('products:category')}</Label>
                            <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('products:selectCategory')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.categoryId && (
                                <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="prix">{t('products:price')}</Label>
                                <Input
                                    id="prix"
                                    name="prix"
                                    type="number"
                                    step="0.01"
                                    value={formData.prix}
                                    onChange={handleInputChange}
                                />
                                {errors.prix && (
                                    <p className="text-sm text-red-500 mt-1">{errors.prix}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="qteStock">{t('products:stockQuantity')}</Label>
                                <Input
                                    id="qteStock"
                                    name="qteStock"
                                    type="number"
                                    value={formData.qteStock}
                                    onChange={handleInputChange}
                                />
                                {errors.qteStock && (
                                    <p className="text-sm text-red-500 mt-1">{errors.qteStock}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="seuilMin">{t('products:minimumStock')}</Label>
                                <Input
                                    id="seuilMin"
                                    name="seuilMin"
                                    type="number"
                                    value={formData.seuilMin}
                                    onChange={handleInputChange}
                                />
                                {errors.seuilMin && (
                                    <p className="text-sm text-red-500 mt-1">{errors.seuilMin}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="nbrPoint">{t('products:fidelityPoints')}</Label>
                                <Input
                                    id="nbrPoint"
                                    name="nbrPoint"
                                    type="number"
                                    value={formData.nbrPoint}
                                    onChange={handleInputChange}
                                />
                                {errors.nbrPoint && (
                                    <p className="text-sm text-red-500 mt-1">{errors.nbrPoint}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>{t('products:productImages')}</Label>
                            <div
                                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center ${
                                    dragActive ? 'border-primary bg-primary/10' : 'border-border'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="images"
                                />
                                <Label
                                    htmlFor="images"
                                    className="flex flex-col items-center gap-2 cursor-pointer"
                                >
                                    <Image className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {t('products:dragDropImages')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {t('products:acceptedFormats')}
                                    </span>
                                </Label>
                            </div>

                            {previewImages.length > 0 && (
                                <div className="mt-4 grid grid-cols-4 gap-4">
                                    {previewImages.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`${t('products:preview')} ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common:cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {product ? t('products:updating') : t('products:creating')}
                                </>
                            ) : (
                                product ? t('products:updateProduct') : t('products:createProduct')
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}