"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowRight,
  Cpu,
  MemoryStick as Memory,
  Zap,
  HardDrive,
  Shield,
  Truck,
  ChevronRight,
  Sparkles,
  ChevronLeft,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { AIRecommendations } from "@/components/ai-recommendations";
import { CustomerStories } from "@/components/CustomerStories";
import { motion, AnimatePresence } from "framer-motion";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
    title: "Beyond Imagination",
    subtitle: "Digital Revolution",
    description: "Step into tomorrow's technology today. Experience the convergence of artificial intelligence, quantum computing, and human creativity in perfect harmony.",
    quote: {
      text: "The most profound technologies are those invisible to the user, woven into the fabric of everyday life.",
      author: "Bill Gates",
    },
    theme: "from-emerald-500 via-teal-600 to-cyan-700",
    accent: "emerald",
    cta: "Explore Future",
    link: "/store",
  },
  {
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1920",
    title: "Code the Future",
    subtitle: "Innovation Unleashed",
    description: "Unleash your potential with tools that empower creation, from immersive AR to lightning-fast processors.",
    quote: {
      text: "Any sufficiently advanced technology is indistinguishable from magic.",
      author: "Arthur C. Clarke",
    },
    theme: "from-purple-500 via-indigo-600 to-blue-700",
    accent: "indigo",
    cta: "Discover Now",
    link: "/store",
  },
  {
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1920",
    title: "Shape Tomorrow",
    subtitle: "Next-Gen Power",
    description: "Build the world you envision with cutting-edge hardware that pushes the boundaries of possibility.",
    quote: {
      text: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
    },
    theme: "from-rose-500 via-red-600 to-orange-700",
    accent: "rose",
    cta: "Shop Now",
    link: "/store",
  },
];

const featuredProducts = [
  {
    id: 1,
    name: "Quantum X Pro Gaming Laptop",
    price: 2499.99,
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
    category: "Laptops",
    rating: 4.8,
    reviews: 124,
    badge: "New Release",
  },
  {
    id: 2,
    name: "Neural GPU 32GB",
    price: 1999.99,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
    category: "Components",
    rating: 4.9,
    reviews: 89,
    badge: "Best Seller",
  },
  {
    id: 3,
    name: "HoloLens Pro AR",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
    category: "AR/VR",
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 4,
    name: "Quantum Core Desktop",
    price: 3499.99,
    image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800",
    category: "Desktops",
    rating: 4.9,
    reviews: 78,
    badge: "Limited Edition",
  },
];

const categories = [
  {
    name: "Gaming PCs",
    image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800",
    icon: <Cpu className="size-6" />,
    description: "Custom-built gaming rigs",
    color: "from-blue-600 to-indigo-600",
  },
  {
    name: "Components",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
    icon: <Memory className="size-6" />,
    description: "High-performance parts",
    color: "from-purple-600 to-pink-600",
  },
  {
    name: "AR/VR",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
    icon: <HardDrive className="size-6" />,
    description: "Immersive experiences",
    color: "from-emerald-600 to-teal-600",
  },
  {
    name: "Laptops",
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
    icon: <Laptop className="size-6" />,
    description: "Portable powerhouses",
    color: "from-amber-600 to-orange-600",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({
    hero: false,
    categories: false,
    featured: false,
    ai: false,
    testimonials: false,
  });
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }
    if (touchStart - touchEnd < -50) {
      setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
  };

  const startSlideTimer = () => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
    }
    slideTimerRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
  };

  useEffect(() => {
    startSlideTimer();
    setIsVisible({
      hero: true,
      categories: true,
      featured: true,
      ai: true,
      testimonials: true,
    });
    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
      }
    };
  }, [currentSlide]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen overflow-hidden bg-black"
        initial="hidden"
        animate={isVisible.hero ? "visible" : "hidden"}
        variants={fadeInUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, index) => (
            currentSlide === index && (
              <motion.div
                key={index}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.2, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: -2 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    filter: "brightness(0.35) contrast(1.3) saturate(1.2)",
                  }}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${slide.theme} opacity-50`}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.4)_0%,_transparent_70%)]" />
              </motion.div>
            )
          ))}
        </AnimatePresence>

        <div className="container relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-16">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            key={`content-${currentSlide}`}
          >
            <Badge
              className={`mb-6 inline-block bg-${heroSlides[currentSlide].accent}-500/30 text-${heroSlides[currentSlide].accent}-200 border-${heroSlides[currentSlide].accent}-500/20 px-5 py-2 text-sm font-medium uppercase tracking-wider backdrop-blur-lg transition-all hover:bg-${heroSlides[currentSlide].accent}-500/50`}
            >
              {heroSlides[currentSlide].subtitle}
            </Badge>
            <motion.h1
              className={`mb-6 bg-gradient-to-r ${heroSlides[currentSlide].theme} bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-7xl lg:text-8xl`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {heroSlides[currentSlide].title}
            </motion.h1>
            <motion.p
              className="mx-auto mb-8 max-w-3xl text-lg text-gray-100 sm:text-xl lg:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              {heroSlides[currentSlide].description}
            </motion.p>
            <motion.blockquote
              className="mx-auto mb-10 max-w-2xl text-base italic text-gray-300 sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              "{heroSlides[currentSlide].quote.text}" <br />
              <span className="text-sm text-gray-400">
                — {heroSlides[currentSlide].quote.author}
              </span>
            </motion.blockquote>
            <motion.div
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <Button
                size="lg"
                className={`relative overflow-hidden rounded-full bg-gradient-to-r ${heroSlides[currentSlide].theme} px-10 py-3 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-${heroSlides[currentSlide].accent}-500/30`}
              >
                <span className="relative z-10">
                  {heroSlides[currentSlide].cta}
                  <ArrowRight className="ml-2 inline-block size-5" />
                </span>
                <span
                  className={`absolute inset-0 bg-gradient-to-r ${heroSlides[currentSlide].theme} opacity-0 transition-opacity duration-300 hover:opacity-20`}
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`rounded-full border-2 border-${heroSlides[currentSlide].accent}-400/50 bg-transparent text-${heroSlides[currentSlide].accent}-200 hover:bg-${heroSlides[currentSlide].accent}-500/10 hover:text-${heroSlides[currentSlide].accent}-100 transition-all duration-300`}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`h-3 rounded-full transition-all duration-500 ${
                currentSlide === index
                  ? `w-16 bg-${heroSlides[currentSlide].accent}-400 shadow-${heroSlides[currentSlide].accent}-500/50 shadow-md`
                  : `w-3 bg-white/40 hover:bg-${heroSlides[currentSlide].accent}-300/20`
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        <div className="absolute left-6 top-1/2 z-20 -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full bg-black/60 p-3 text-${heroSlides[currentSlide].accent}-300 hover:bg-${heroSlides[currentSlide].accent}-500/30 hover:text-${heroSlides[currentSlide].accent}-100 transition-all duration-300`}
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
            }
          >
            <ChevronLeft className="size-6" />
          </Button>
        </div>
        <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full bg-black/60 p-3 text-${heroSlides[currentSlide].accent}-300 hover:bg-${heroSlides[currentSlide].accent}-500/30 hover:text-${heroSlides[currentSlide].accent}-100 transition-all duration-300`}
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section
        className="bg-gradient-to-b from-background to-background/50 py-24"
        initial="hidden"
        animate={isVisible.categories ? "visible" : "hidden"}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <Badge className="mb-4">Browse Categories</Badge>
            <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              Cutting-Edge Technology
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Discover our wide range of next-generation tech products designed
              for performance and innovation
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/store?category=${category.name.toLowerCase().replace(" ", "-")}`}
                  className="group block"
                >
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 transition-opacity group-hover:opacity-70`}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                      <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-xl transition-transform group-hover:scale-110">
                        {category.icon}
                      </div>
                      <h3 className="mb-2 text-2xl font-bold">
                        {category.name}
                      </h3>
                      <p className="text-center text-white/90">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="group rounded-full"
              asChild
            >
              <Link href="/store">
                View All Categories
                <ChevronRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* AI Recommendations section */}
      <motion.section
        className="bg-black/5 py-24 backdrop-blur-xl"
        initial="hidden"
        animate={isVisible.ai ? "visible" : "hidden"}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <Badge className="mb-4">Personalized For You</Badge>
            <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              AI-Powered Recommendations
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our advanced AI analyzes your preferences to suggest products that
              match your unique tech needs
            </p>
          </div>
          <AIRecommendations />
        </div>
      </motion.section>

      {/* Featured Products Section */}
      <motion.section
        className="py-24"
        initial="hidden"
        animate={isVisible.featured ? "visible" : "hidden"}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <Badge className="mb-4">Top Picks</Badge>
            <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              Featured Products
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Discover our most popular tech products, handpicked for
              exceptional performance and innovation
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden">
                  <Link
                    href={`/product/${product.id}`}
                    className="flex flex-1 flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      {product.badge && (
                        <Badge className="absolute left-2 top-2 bg-primary/90 backdrop-blur-sm">
                          {product.badge}
                        </Badge>
                      )}
                      <Badge className="absolute right-2 top-2 bg-black/70 backdrop-blur-sm">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-2 line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
                        {product.name}
                      </h3>
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex items-center text-yellow-500">
                          <Star className="size-4 fill-current" />
                          <span className="ml-1">{product.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews} reviews)
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-xl font-bold">${product.price}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="group rounded-full"
              asChild
            >
              <Link href="/store">
                View All Products
                <ChevronRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <CustomerStories />

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white/50 p-8 backdrop-blur-xl transition-shadow hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="rounded-xl bg-blue-600/10 p-4">
                  <Truck className="size-8 text-blue-600" />
                </div>
              </div>
              <h3 className="mb-3 text-center text-xl font-semibold">
                Fast Shipping
              </h3>
              <p className="text-center text-muted-foreground">
                Free express shipping on orders over $100, with guaranteed
                delivery within 2 business days
              </p>
            </div>
            <div className="rounded-2xl bg-white/50 p-8 backdrop-blur-xl transition-shadow hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="rounded-xl bg-purple-600/10 p-4">
                  <Shield className="size-8 text-purple-600" />
                </div>
              </div>
              <h3 className="mb-3 text-center text-xl font-semibold">
                Extended Warranty
              </h3>
              <p className="text-center text-muted-foreground">
                All products come with a 2-year extended warranty and 30-day
                money-back guarantee
              </p>
            </div>
            <div className="rounded-2xl bg-white/50 p-8 backdrop-blur-xl transition-shadow hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="rounded-xl bg-blue-600/10 p-4">
                  <Sparkles className="size-8 text-blue-600" />
                </div>
              </div>
              <h3 className="mb-3 text-center text-xl font-semibold">
                Expert Support
              </h3>
              <p className="text-center text-muted-foreground">
                24/7 technical assistance from our team of certified tech
                specialists for all your needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Stay Updated</Badge>
            <h2 className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              Join Our Tech Community
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Subscribe to our newsletter for exclusive tech news, product
              launches, and special offers delivered directly to your inbox
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 flex-1 rounded-full border border-input bg-background/50 px-4 py-2 text-sm shadow-sm backdrop-blur-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button className="h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}