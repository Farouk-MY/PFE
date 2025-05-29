"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Star,
  Truck,
  Shield,
  Heart,
  Share2,
  ShoppingCart,
  Check,
  ChevronRight,
  Gift,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Product, ProductReview, useClientControllerStore, useCartStore, ClientProduct } from "@/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

const calculatePointsDiscount = (points: number) => {
  // Base conversion: 2000 points = 10% discount
  const discountPercentage = (points / 2000) * 10;

  // Round to 2 decimal places for better display
  return Math.round(discountPercentage * 100) / 100;
};

const calculatePointsDiscountAmount = (points: number, price: number) => {
  const discountPercentage = calculatePointsDiscount(points);
  const discountAmount = (discountPercentage / 100) * price;

  // Round to 2 decimal places for currency
  return Math.round(discountAmount * 100) / 100;
};

export default function ProductPageClient({ product }: { product: ClientProduct }) {
  const { addItem } = useCartStore();
  const {
    submitProductReview,
    fetchProductById,
    updateReview,
    deleteReview,
    checkIsFavorite,
    addToFavorites,
    removeFromFavoritesByProductId
  } = useClientControllerStore();
  const { user, isAuthenticated } = useAuthStore();

  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | undefined>(undefined);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [showFavoriteLoginAlert, setShowFavoriteLoginAlert] = useState(false);

  // New state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState<number | null>(null);

  // New state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setReviewName(`${user.prenom || ''} ${user.nom || ''}`.trim());
      setReviewEmail(user.email || '');
    }
  }, [user]);

  // Check if the product is in favorites when the component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated && product.id) {
        try {
          const result = await checkIsFavorite(product.id);
          setIsFavorite(result.isFavorite);
          setFavoriteId(result.favoriteId);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, product.id, checkIsFavorite]);

  const handleAddToCart = () => {
    addItem({
      id: String(product.id),
      name: product.designation,
      price: product.prix,
      quantity,
      image: product.images?.length > 0 ? product.images[0] : "/placeholder-product.jpg",
      points: product.nbrPoint,
    });
    toast.success(`${product.designation} added to cart!`);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowFavoriteLoginAlert(true);
      return;
    }

    setIsProcessingFavorite(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const success = await removeFromFavoritesByProductId(product.id);
        if (success) {
          setIsFavorite(false);
          setFavoriteId(undefined);
          toast.success(`${product.designation} removed from favorites`);
        }
      } else {
        // Add to favorites
        const success = await addToFavorites(product.id);
        if (success) {
          setIsFavorite(true);
          // Re-check to get the favorite ID
          const result = await checkIsFavorite(product.id);
          setFavoriteId(result.favoriteId);
          toast.success(`${product.designation} added to favorites`);
        }
      }
    } catch (error) {
      toast.error("Failed to update favorites");
      console.error("Error updating favorites:", error);
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const handleReviewButtonClick = () => {
    if (!isAuthenticated) {
      setShowLoginAlert(true);
    } else {
      // Reset form when opening in add mode
      setIsEditMode(false);
      setCurrentReviewId(null);
      setReviewText("");
      setReviewRating(5);
      setDialogOpen(true);
    }
  };

  const handleEditReview = (review: any) => {
    if (!isAuthenticated) {
      setShowLoginAlert(true);
      return;
    }

    // Set edit mode and load review data
    setIsEditMode(true);
    setCurrentReviewId(review.id);
    setReviewText(review.content);
    setReviewRating(review.rating);
    setDialogOpen(true);
  };

  const handleDeleteClick = (reviewId: number) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (reviewToDelete === null) return;

    setIsSubmitting(true);
    try {
      const success = await deleteReview(reviewToDelete);
      if (success) {
        toast.success("Review deleted successfully");
        // Refresh product data to update the reviews list
        if (product.id) {
          await fetchProductById(product.id);
        }
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete review");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user is logged in
      if (!isAuthenticated) {
        toast.error("You must be logged in to submit a review");
        setDialogOpen(false);
        setShowLoginAlert(true);
        return;
      }

      if (isEditMode && currentReviewId !== null) {
        // Update existing review
        await updateReview(currentReviewId, reviewRating, reviewText);
        toast.success("Your review has been updated successfully!");
      } else {
        // Submit new review
        await submitProductReview(product.id, reviewRating, reviewText);
        toast.success("Your review has been submitted successfully!");
      }

      // Refresh product data to show the new/updated review
      await fetchProductById(product.id);

      // Reset form and close dialog
      setReviewText("");
      setReviewRating(5);
      setDialogOpen(false);
      setIsEditMode(false);
      setCurrentReviewId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use product images from API or fallback to placeholders
  const productImages = product.images && product.images.length > 0
      ? product.images
      : [
        "/placeholder-product.jpg",
        "/placeholder-product-2.jpg",
        "/placeholder-product-3.jpg",
      ];

  // Calculate rating from product reviews or use default
  const averageRating = product.avgRating ?? 0;

  // Get reviews count
  const reviewsCount = product.avis?.length ?? 0;

  // Calculate points discount information
  const pointsDiscountPercentage = calculatePointsDiscount(product.nbrPoint ?? 0);
  const pointsDiscountAmount = calculatePointsDiscountAmount(product.nbrPoint ?? 0, product.prix ?? 0);

  // Process reviews data with proper type checking
  const reviews = product.avis?.map(review => {
    console.log("Raw review data:", review);

    const reviewDate = review.date ? new Date(review.date).toLocaleDateString() : "Unknown date";

    // Check if utilisateur exists and has the expected properties
    if (!review.utilisateur) {
      console.warn("Review missing user data:", review.id);
    }

    const userName = review.utilisateur ?
        `${review.utilisateur.prenom || ''} ${review.utilisateur.nom || ''}`.trim() || 'Anonymous' :
        'Anonymous';
    const initialsForAvatar = userName !== 'Anonymous' ? userName.charAt(0).toUpperCase() : 'A';

    // IMPORTANT FIX: Get the correct user ID from the review
    // This is the key change - use utilisateur_id directly instead of trying to get it from utilisateur.id
    const reviewUserId = review.utilisateur.id ? String(review.utilisateur.id) : null;
    const currentUserId = user?.id ? String(user.id) : null;

    const isUserReview = isAuthenticated &&
        currentUserId !== null &&
        reviewUserId !== null &&
        currentUserId === reviewUserId;

    // Log each review's user check with the correct ID value
    console.log(`Review #${review.id} check:`, {
      reviewUserId,
      currentUserId,
      isMatch: currentUserId === reviewUserId,
      isUserReview
    });

    return {
      id: review.id,
      name: userName,
      date: reviewDate,
      rating: review.note,
      content: review.commentaire || "Great product!",
      avatar: "/placeholder-avatar.jpg",
      avatarFallback: initialsForAvatar,
      verified: true,
      isUserReview: isUserReview,
      utilisateur: review.utilisateur
    };
  }) ?? [];

  // Calculate rating distribution from actual reviews
  const calculateRatingDistribution = () => {
    if (!product.avis || product.avis.length === 0) {
      return [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
      ];
    }

    const distribution = [
      { stars: 5, count: product.avis.filter(r => r.note === 5).length },
      { stars: 4, count: product.avis.filter(r => r.note === 4).length },
      { stars: 3, count: product.avis.filter(r => r.note === 3).length },
      { stars: 2, count: product.avis.filter(r => r.note === 2).length },
      { stars: 1, count: product.avis.filter(r => r.note === 1).length },
    ];

    return distribution;
  };

  const ratingDistribution = calculateRatingDistribution();
  const totalReviews = reviewsCount;

  // Fixed: Added parentheses to fix '&&' and '??' operations mix
  const userHasReviewed = (user && product.avis?.some(review => {
    if (!review.utilisateur || !user.id) return false;
    // Convert both IDs to strings for comparison
    const userId = String(user.id);
    const reviewUserId = String(review.utilisateur.id);
    return reviewUserId === userId;
  })) ?? false;


  return (
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Favorite Login Alert Dialog */}
        <Dialog open={showFavoriteLoginAlert} onOpenChange={setShowFavoriteLoginAlert}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Login Required</DialogTitle>
              <DialogDescription>
                You need to be logged in to add items to your favorites.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert className="bg-blue-50 text-blue-800">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Please log in to save this product to your favorites.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Link href="/login" passHref>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Go to Login
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setShowFavoriteLoginAlert(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">
            Home
          </a>
          <ChevronRight className="mx-2 size-4" />
          <a href="/store" className="hover:text-primary">
            Store
          </a>
          <ChevronRight className="mx-2 size-4" />
          <a
              href={`/category/${product.category?.id}`}
              className="hover:text-primary"
          >
            {product.category?.name || "Category"}
          </a>
          <ChevronRight className="mx-2 size-4" />
          <span className="text-foreground">{product.designation}</span>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Product Images */}
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square overflow-hidden rounded-xl bg-black/5 backdrop-blur-xl">
                        <img
                            src={image}
                            alt={`${product.designation} - View ${index + 1}`}
                            className="size-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {productImages.slice(0, 3).map((image, index) => (
                  <div
                      key={index}
                      className="aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-transparent transition hover:border-primary hover:opacity-75"
                  >
                    <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="size-full object-cover"
                    />
                  </div>
              ))}
              <div className="flex aspect-square cursor-pointer items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80">
                <span>360° View</span>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="mb-2">
                  {product.category?.name || "Category"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full ${isFavorite ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                      onClick={handleToggleFavorite}
                      disabled={isProcessingFavorite}
                  >
                    <Heart className={`size-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Share2 className="size-5" />
                  </Button>
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold">{product.designation}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                          key={star}
                          className={`size-5 ${
                              star <= averageRating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                          }`}
                      />
                  ))}
                  <span className="ml-2 text-lg">{averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}</span>
                </div>
                <span className="text-muted-foreground">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </span>
              </div>

              {/* Points Badge with Discount Value */}
              <div className="mt-4 flex items-center gap-2">
                <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary"
                >
                  <Gift className="size-4" />
                  Earn {product.nbrPoint} Points
                </Badge>
                <span className="text-sm text-muted-foreground">
                ≈ {pointsDiscountPercentage}% discount (${pointsDiscountAmount.toFixed(2)} TND)
              </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{product.prix} TND</span>
                {/* Add original price/discount logic here if available */}
              </div>
              <div className="flex items-center gap-4">
                <Badge
                    variant={(product.qteStock ?? 0) > 0 ? "secondary" : "destructive"}
                    className={`px-3 py-1 ${(product.qteStock ?? 0) > 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
                >
                  {(product.qteStock ?? 0) > 0
                      ? `${product.qteStock} in stock`
                      : "Out of stock"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">
                {product.description || `Experience unparalleled performance with the ${product.designation}. Designed for professionals and enthusiasts who demand the best.`}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md border">
                  <button
                      className="px-4 py-2 hover:bg-muted disabled:opacity-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={(product.qteStock ?? 0) === 0}
                  >
                    -
                  </button>
                  <span className="min-w-12 border-x px-4 py-2 text-center">
                  {quantity}
                </span>
                  <button
                      className="px-4 py-2 hover:bg-muted disabled:opacity-50"
                      onClick={() =>
                          setQuantity(Math.min(product.qteStock ?? 0, quantity + 1))
                      }
                      disabled={(product.qteStock ?? 0) === 0 || quantity >= (product.qteStock ?? 0)}
                  >
                    +
                  </button>
                </div>
                <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                    onClick={handleAddToCart}
                    disabled={(product.qteStock ?? 0) === 0}
                >
                  <ShoppingCart className="mr-2 size-5" />
                  Add to Cart
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    disabled={(product.qteStock ?? 0) === 0}
                >
                  Buy Now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y py-6">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-blue-600" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">
                    On orders over 300 TND
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-purple-600" />
                <div>
                  <p className="font-medium">2 Year Warranty</p>
                  <p className="text-sm text-muted-foreground">Full coverage</p>
                </div>
              </div>
            </div>

            {/* Points Value Information */}
            <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Gift className="size-5" /> Points Value Information
              </h4>
              <p className="text-sm">
                Earn {product.nbrPoint} points with this purchase, which is equivalent to a {pointsDiscountPercentage}% discount worth {pointsDiscountAmount.toFixed(2)} TND.
                Points can be redeemed on future purchases (2000 points = 10% discount).
              </p>
            </div>
          </div>
        </div>

        {/* Login Alert Dialog */}
        <Dialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Login Required</DialogTitle>
              <DialogDescription>
                You need to be logged in to submit a review.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert className="bg-blue-50 text-blue-800">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Please log in to share your experience with this product.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Link href="/login" passHref>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Go to Login
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setShowLoginAlert(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your review? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reviews Section */}
        <div className="mb-16 rounded-lg bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold">Customer Reviews</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="rounded-xl bg-muted/30 p-6">
                <h3 className="mb-2 text-2xl font-bold">
                  {reviewsCount > 0 ? averageRating.toFixed(1) : "No ratings"}
                </h3>
                <div className="mb-4 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                          key={star}
                          className={`size-5 ${
                              star <= Math.round(averageRating)
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                          }`}
                      />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
                </div>

                {totalReviews > 0 ? (
                    <div className="space-y-2">
                      {ratingDistribution.map((item) => (
                          <div key={item.stars} className="flex items-center gap-2">
                            <div className="flex w-12 items-center">
                              <span className="text-sm">{item.stars}</span>
                              <Star className="ml-1 size-4 fill-yellow-500 text-yellow-500" />
                            </div>
                            <Progress
                                value={totalReviews > 0 ? (item.count / totalReviews) * 100 : 0}
                                className="h-2 flex-1"
                            />
                            <span className="w-10 text-right text-sm text-muted-foreground">
                        {totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0}%
                      </span>
                          </div>
                      ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No reviews yet. Be the first to review this product!
                    </p>
                )}
              </div>

              <div className="mt-8">
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  if (!open) {
                    // Reset form state when closing dialog without submitting
                    setIsEditMode(false);
                    setCurrentReviewId(null);
                    setReviewText("");
                    setReviewRating(5);
                  }
                  setDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={handleReviewButtonClick}
                        disabled={userHasReviewed && !isEditMode}
                    >
                      {userHasReviewed && !isEditMode ? "You've Already Reviewed" : "Write a Review"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? "Edit Your Review" : "Write a Review"}</DialogTitle>
                      <DialogDescription>
                        {isEditMode
                            ? "Update your review for this product."
                            : "Share your experience with this product to help other customers make informed decisions."
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmitReview}
                        className="mt-4 space-y-4"
                    >
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Your Rating
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none"
                              >
                                <Star
                                    className={`size-6 ${
                                        star <= reviewRating
                                            ? "fill-yellow-500 text-yellow-500"
                                            : "text-gray-300"
                                    }`}
                                />
                              </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Your Review
                        </label>
                        <Textarea
                            placeholder="Share your experience with this product..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="min-h-[120px]"
                            required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                            disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : isEditMode ? "Update Review" : "Submit Review"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setDialogOpen(false);
                              setIsEditMode(false);
                              setCurrentReviewId(null);
                              setReviewText("");
                              setReviewRating(5);
                            }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="md:col-span-2">
              {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center">
                              <Avatar className="mr-3 size-10">
                                <AvatarImage src={review.avatar} alt={review.name} />
                                <AvatarFallback>{review.avatarFallback}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium">{review.name}</h4>
                                  {review.verified && (
                                      <Badge
                                          variant="outline"
                                          className="ml-2 border-green-200 bg-green-50 text-xs text-green-700"
                                      >
                                        <Check className="mr-1 size-3" /> Verified
                                        Purchase
                                      </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {review.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                      key={star}
                                      className={`size-4 ${
                                          star <= review.rating
                                              ? "fill-yellow-500 text-yellow-500"
                                              : "text-gray-300"
                                      }`}
                                  />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.content}</p>

                          {/* Modified review action buttons - only showing Edit/Delete for user's own reviews */}
                          {review.isUserReview && (
                              <div className="mt-3 flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => handleEditReview(review)}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleDeleteClick(review.id)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                          )}
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No reviews yet for this product.</p>
                    <Button
                        variant="outline"
                        onClick={handleReviewButtonClick}
                        disabled={userHasReviewed}
                    >
                      Be the first to write a review
                    </Button>
                  </div>
              )}

              {reviews.length > 5 && (
                  <Button variant="outline" className="mt-4 w-full">
                    Load More Reviews
                  </Button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}