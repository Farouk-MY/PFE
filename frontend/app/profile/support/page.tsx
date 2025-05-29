"use client"

import { useState } from 'react'
import { useUserStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileSidebar } from '@/components/profile-sidebar'
import {
    HelpCircle,
    MessageSquare,
    Phone,
    Mail,
    FileText,
    Search,
    ChevronRight,
    ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "How do I track my order?",
        answer: "You can track your order by going to the Orders section in your account dashboard. Click on the specific order to view its current status and tracking information."
    },
    {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for most items. Products must be in original condition with all packaging and accessories. Some items may have specific return restrictions."
    },
    {
        question: "How do I redeem my points?",
        answer: "Points can be redeemed during checkout. Simply select the number of points you wish to use, and the corresponding discount will be applied to your order. Each point is worth $0.01."
    },
    {
        question: "How long does shipping take?",
        answer: "Standard shipping typically takes 5-7 business days. Express shipping (2-3 business days) and next-day delivery are available for select locations. Free shipping is offered on orders over $100."
    }
]

const supportCategories = [
    {
        title: "Orders & Shipping",
        icon: <FileText className="h-5 w-5" />,
        description: "Track orders, shipping info, and returns"
    },
    {
        title: "Technical Support",
        icon: <HelpCircle className="h-5 w-5" />,
        description: "Product setup and troubleshooting"
    },
    {
        title: "Account & Security",
        icon: <MessageSquare className="h-5 w-5" />,
        description: "Account access and security settings"
    }
]

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const { user } = useUserStore()

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <ProfileSidebar />

                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold">Help & Support</h1>
                            <p className="text-muted-foreground mt-1">
                                Get help with your account, orders, and technical issues
                            </p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search for help articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {supportCategories.map((category, index) => (
                                <motion.div
                                    key={category.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className="p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                {category.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{category.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {category.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="w-full">
                                            View Articles
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <h3 className="font-medium">Live Chat</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Chat with our support team in real-time
                                    </p>
                                    <Badge className="mb-4">Available 24/7</Badge>
                                    <Button className="w-full">Start Chat</Button>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <h3 className="font-medium">Phone Support</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Call us for immediate assistance
                                    </p>
                                    <Badge className="mb-4">Mon-Fri, 9AM-6PM</Badge>
                                    <Button variant="outline" className="w-full">
                                        1-800-TECH-HELP
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <h3 className="font-medium">Email Support</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Send us an email anytime
                                    </p>
                                    <Badge className="mb-4">24-48hr response</Badge>
                                    <Button variant="outline" className="w-full">
                                        Send Email
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {filteredFaqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`faq-${index}`}>
                                        <AccordionTrigger className="text-left">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-muted-foreground">
                                                {faq.answer}
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">Help Resources</h2>
                                <Button variant="outline">View All</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="justify-between">
                                    User Guide
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="justify-between">
                                    Video Tutorials
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="justify-between">
                                    Community Forum
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="justify-between">
                                    Developer Docs
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}