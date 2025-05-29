"use client"

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Star, Check, Heart, Share2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const testimonials = [
  {
    name: "Alex Chen",
    role: "Professional Gamer & Content Creator",
    content: "The Quantum X Pro completely transformed my gaming experience. The performance is unmatched and the cooling system keeps everything running smoothly even during intense tournaments. After 6 months of daily use, I can confidently say this is the best gaming laptop I've ever owned.",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    purchaseDate: "2024-01-15",
    verifiedPurchase: true,
    productName: "Quantum X Pro Gaming Laptop",
    productImage: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
    likes: 234,
    featured: true,
  },
  {
    name: "Sarah Johnson",
    role: "3D Artist & VFX Specialist",
    content: "As someone who works with demanding 3D applications daily, the Neural GPU has been a game-changer for my workflow. Rendering times are cut in half, and the real-time preview performance is exceptional. The build quality and attention to detail are exactly what you'd expect at this price point.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    purchaseDate: "2024-02-01",
    verifiedPurchase: true,
    productName: "Neural GPU 32GB",
    productImage: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
    likes: 187,
    featured: true,
  },
  {
    name: "Michael Torres",
    role: "Software Developer",
    content: "The build quality and performance of my TechVerse desktop are exceptional. Customer support was also incredibly helpful when I needed assistance with upgrades. The attention to detail in cable management and component selection shows they really care about quality.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    purchaseDate: "2024-01-28",
    verifiedPurchase: true,
    productName: "Quantum Core Desktop",
    productImage: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800",
    likes: 156,
    featured: true,
  },
  {
    name: "Emily Zhang",
    role: "Creative Director",
    content: "The HoloLens Pro AR has revolutionized how we present designs to clients. The visual fidelity and comfort during extended use are impressive. It's not just a product, it's a game-changer for our creative process.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    purchaseDate: "2024-02-10",
    verifiedPurchase: true,
    productName: "HoloLens Pro AR",
    productImage: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
    likes: 143,
    featured: false,
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export function CustomerStories() {
  return (
    <motion.section 
      className="py-24 bg-black/5 backdrop-blur-xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4">Customer Stories</Badge>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Voices of Our Community
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real experiences from tech enthusiasts who have transformed their digital lives with our products
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {testimonials.slice(0, 2).map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white">
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                        </Avatar>
                        {testimonial.verifiedPurchase && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                      Featured
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground">{testimonial.content}</p>
                  </div>

                  <div className="mt-auto">
                    <div className="border-t pt-4">
                      <div className="flex items-center">
                        <img
                          src={testimonial.productImage}
                          alt={testimonial.productName}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium">{testimonial.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Purchased {format(new Date(testimonial.purchaseDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Heart className="h-4 w-4 mr-1" />
                        {testimonial.likes} people found this helpful
                      </Button>
                      <Button variant="ghost" size="sm">
                        Share <Share2 className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(2).map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (index + 2) * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{testimonial.content}</p>

                  <div className="flex items-center pt-4 border-t">
                    <img
                      src={testimonial.productImage}
                      alt={testimonial.productName}
                      className="h-12 w-12 object-cover rounded"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-medium">{testimonial.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(testimonial.purchaseDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" className="rounded-full">
            View All Reviews
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  )
}