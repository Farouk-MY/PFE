"use client";

import { useEffect, useState } from "react";
import { useRecommendationsStore } from "@/lib/store";
import { useCartStore } from "@/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Star,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

// Define types for the product
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  confidence: number;
  description: string;
  tags: string[];
}

export function AIRecommendations() {
  const { recommendations, loading, generateRecommendations } =
    useRecommendationsStore();
  const { addItem } = useCartStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Enhanced recommendations with more details
  const enhancedRecommendations: Product[] = [
    {
      id: 1,
      name: "Quantum X Pro Gaming Laptop",
      price: 2499.99,
      image:
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
      category: "Laptops",
      rating: 4.8,
      reviews: 124,
      confidence: 0.95,
      description:
        "Cutting-edge gaming laptop with Neural X9 processor and RTX 5080 Ti graphics",
      tags: ["Gaming", "High Performance", "Premium"],
    },
    {
      id: 2,
      name: "Neural GPU 32GB",
      price: 1999.99,
      image:
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
      category: "Components",
      rating: 4.9,
      reviews: 89,
      confidence: 0.92,
      description:
        "Next-generation graphics card with 24576 CUDA cores and 32GB GDDR7 memory",
      tags: ["Gaming", "Content Creation", "AI"],
    },
    {
      id: 3,
      name: "HoloLens Pro AR",
      price: 1299.99,
      image:
        "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
      category: "AR/VR",
      rating: 4.7,
      reviews: 156,
      confidence: 0.88,
      description:
        "Immersive augmented reality headset with 8K resolution and 150° field of view",
      tags: ["AR/VR", "Innovation", "Entertainment"],
    },
    {
      id: 4,
      name: "Quantum Core Desktop",
      price: 3499.99,
      image:
        "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800",
      category: "Desktops",
      rating: 4.9,
      reviews: 78,
      confidence: 0.91,
      description:
        "Ultimate desktop powerhouse with Quantum i13 processor and liquid nitrogen cooling",
      tags: ["Workstation", "Gaming", "Premium"],
    },
    {
      id: 5,
      name: "Neural Haptic Controller",
      price: 299.99,
      image:
        "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=800",
      category: "Gaming",
      rating: 4.8,
      reviews: 245,
      confidence: 0.87,
      description:
        "Advanced gaming controller with neural feedback and 100-hour battery life",
      tags: ["Gaming", "Accessories", "Innovation"],
    },
  ];

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      points: 0, // Adding the missing points property
    });
    toast.success(`${product.name} added to cart!`);
  };

  const nextProduct = () => {
    setDirection(1);
    setCurrentIndex(
      (prevIndex) => (prevIndex + 1) % enhancedRecommendations.length,
    );
    setUserInteracted(true);
  };

  const prevProduct = () => {
    setDirection(-1);
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + enhancedRecommendations.length) %
        enhancedRecommendations.length,
    );
    setUserInteracted(true);
  };

  useEffect(() => {
    if (!userInteracted && autoplayEnabled && !loading) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentIndex(
          (prevIndex) => (prevIndex + 1) % enhancedRecommendations.length,
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [
    userInteracted,
    autoplayEnabled,
    loading,
    enhancedRecommendations.length,
  ]);

  useEffect(() => {
    if (userInteracted) {
      const timer = setTimeout(() => {
        setUserInteracted(false);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [userInteracted, currentIndex]);

  // Add proper typing to the variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="size-5 animate-pulse text-primary" />
          <h2 className="text-xl font-semibold">
            Generating Recommendations...
          </h2>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600">
            <div
              className="absolute inset-0 animate-[shimmer_2s_infinite] bg-white/20"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <div className="relative flex size-16 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
              <Sparkles className="size-8 text-white" />
            </div>
            <p className="mt-4 text-center text-muted-foreground">
              Our AI is analyzing your preferences to find the perfect products
              for you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur" />
            <div className="relative rounded-md bg-gradient-to-r from-blue-600 to-purple-600 p-1.5">
              <Sparkles className="size-5 text-white" />
            </div>
          </div>
          <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-semibold text-transparent">
            AI-Powered Recommendations
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() => generateRecommendations()}
          className="group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <Sparkles className="mr-2 size-4 text-primary group-hover:animate-pulse" />
          Refresh
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="absolute inset-0 bg-white/20" />
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="relative aspect-square">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0"
                >
                  <div className="relative h-full overflow-hidden rounded-xl bg-black/5 backdrop-blur-xl">
                    <img
                      src={enhancedRecommendations[currentIndex].image}
                      alt={enhancedRecommendations[currentIndex].name}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute left-3 top-3 border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {Math.round(
                        enhancedRecommendations[currentIndex].confidence * 100,
                      )}
                      % Match
                    </Badge>
                    <Badge className="absolute right-3 top-3 border-0 bg-black/70 text-white backdrop-blur-sm">
                      {enhancedRecommendations[currentIndex].category}
                    </Badge>
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-md transition-all hover:bg-white/40"
                onClick={prevProduct}
              >
                <ChevronLeft className="size-5 text-white" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-md transition-all hover:bg-white/40"
                onClick={nextProduct}
              >
                <ChevronRight className="size-5 text-white" />
              </Button>

              <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2">
                {enhancedRecommendations.map((_, index) => (
                  <button
                    key={index}
                    className={`transition-all duration-300 ${
                      currentIndex === index
                        ? "w-12 bg-white"
                        : "w-3 bg-white/50 hover:bg-white/75"
                    } h-3 rounded-full`}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                      setUserInteracted(true);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="mb-2 bg-blue-50 text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                  >
                    AI Recommended
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Heart className="size-5" />
                  </Button>
                </div>
                <h3 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  {enhancedRecommendations[currentIndex].name}
                </h3>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-4 ${
                          star <= enhancedRecommendations[currentIndex].rating
                            ? "fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm">
                      {enhancedRecommendations[currentIndex].rating}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({enhancedRecommendations[currentIndex].reviews} reviews)
                  </span>
                </div>
                <p className="mb-4 text-muted-foreground">
                  {enhancedRecommendations[currentIndex].description}
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {enhancedRecommendations[currentIndex].tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 transition-colors hover:from-blue-600/20 hover:to-purple-600/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                    ${enhancedRecommendations[currentIndex].price}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group relative overflow-hidden"
                      asChild
                    >
                      <Link
                        href={`/product/${enhancedRecommendations[currentIndex].id}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      onClick={() =>
                        handleAddToCart(enhancedRecommendations[currentIndex])
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                    >
                      <ShoppingCart className="mr-2 size-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Based on your browsing history and preferences
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="group h-auto p-0"
                    asChild
                  >
                    <Link
                      href="/store"
                      className="flex items-center text-primary"
                    >
                      View all
                      <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
