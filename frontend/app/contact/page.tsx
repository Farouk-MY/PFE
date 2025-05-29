"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    Loader2,
    MessageSquare,
    CheckCircle,
    HelpCircle,
    MapPinned,
    ArrowRight
} from 'lucide-react'
import {
    useClientControllerStore,
    ContactFormData,
    ContactType
} from '@/store'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'
import Link from "next/link";

export default function ContactPage() {
    // Get state and functions from the clientController store
    const {
        isLoading,
        error,
        contactTypes,
        contactSubmitSuccess,
        fetchContactTypes,
        submitContactForm,
        resetContactSubmitStatus
    } = useClientControllerStore()
    
    // Initialize i18n translation
    const { t } = useTranslation(['contact'])
    const { language } = useLanguage()

    // Form state
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
    })

    // Fetch contact types on component mount
    useEffect(() => {
        fetchContactTypes()
    }, [fetchContactTypes])

    // Reset form and status when success state changes
    useEffect(() => {
        if (contactSubmitSuccess) {
            toast.success(t('contactForm.success'))
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                type: 'general'
            })

            // Reset the success status after a delay
            const timer = setTimeout(() => {
                resetContactSubmitStatus()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [contactSubmitSuccess, resetContactSubmitStatus])

    // Show error toast when there's an error
    useEffect(() => {
        if (error) {
            toast.error(error || t('contactForm.error'))
        }
    }, [error, t])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await submitContactForm(formData)
    }

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/20 pt-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden mb-16">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-900/30 dark:to-purple-900/30"></div>
                <div className="container mx-auto px-4 py-20 relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            {t('hero.title')}
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            {t('hero.description')}
                        </p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-blue-200 dark:border-blue-800 shadow-lg w-30"
                            >
                                <Link href="/faqs" className="flex items-center">
                                    {t('hero.faqsButton')} <HelpCircle className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" id="contact-form">
                    {/* Contact Information */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="overflow-hidden border-0 shadow-lg">
                                <div className="h-3 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                                    <h2 className="text-xl font-semibold mb-6">{t('contactInfo.title')}</h2>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-3 rounded-full">
                                                <Mail className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{t('contactInfo.email.label')}</p>
                                                <a href="mailto:support@techverse.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                    {t('contactInfo.email.value')}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-3 rounded-full">
                                                <Phone className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{t('contactInfo.phone.label')}</p>
                                                <a href="tel:+1234567890" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                    {t('contactInfo.phone.value')}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-3 rounded-full">
                                                <MapPin className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{t('contactInfo.address.label')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('contactInfo.address.value').split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < t('contactInfo.address.value').split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-3 rounded-full">
                                                <Clock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{t('contactInfo.hours.label')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('contactInfo.hours.value').split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < t('contactInfo.hours.value').split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="overflow-hidden border-0 shadow-lg">
                                <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <MessageSquare className="h-8 w-8 mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">{t('liveChat.title')}</h3>
                                            <p className="text-white/90 mb-4">
                                                {t('liveChat.description')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
                                    >
                                        {t('liveChat.button')}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <Card className="overflow-hidden border-0 shadow-lg">
                                <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <MapPinned className="h-8 w-8 mb-4 text-primary" />
                                            <h3 className="text-lg font-semibold mb-2">{t('contactInfo.address.label')}</h3>
                                            <p className="text-muted-foreground mb-4">
                                                {t('contactInfo.address.value')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 flex items-center justify-center mb-4">
                                        <p className="text-sm text-muted-foreground">Interactive Map</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {t('contactInfo.address.label')}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <Card className="overflow-hidden border-0 shadow-lg">
                            <div className="h-3 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                            <div className="p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                                <h2 className="text-2xl font-semibold mb-6">{t('contactForm.title')}</h2>

                                {contactSubmitSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center text-center py-12"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-medium mb-2">{t('contactForm.success')}</h3>
                                        <p className="text-muted-foreground mb-6 max-w-md">
                                            {t('contactForm.success')}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={resetContactSubmitStatus}
                                        >
                                            {t('contactForm.submit')}
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">{t('contactForm.name.label')}</Label>
                                                <Input
                                                    id="name"
                                                    placeholder={t('contactForm.name.placeholder')}
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-white/50 dark:bg-gray-800/50"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">{t('contactForm.email.label')}</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder={t('contactForm.email.placeholder')}
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="bg-white/50 dark:bg-gray-800/50"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="type">{t('contactForm.type.label')}</Label>
                                                <Select
                                                    value={formData.type}
                                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                                >
                                                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                                                        <SelectValue placeholder={t('contactForm.type.placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {contactTypes.length > 0 ? (
                                                            contactTypes.map((type: ContactType) => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <SelectItem value="general">General Inquiry</SelectItem>
                                                                <SelectItem value="support">Technical Support</SelectItem>
                                                                <SelectItem value="sales">Sales</SelectItem>
                                                                <SelectItem value="billing">Billing</SelectItem>
                                                                <SelectItem value="partnership">Partnership</SelectItem>
                                                                <SelectItem value="careers">Careers</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="subject">{t('contactForm.subject.label')}</Label>
                                                <Input
                                                    id="subject"
                                                    placeholder={t('contactForm.subject.placeholder')}
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    className="bg-white/50 dark:bg-gray-800/50"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">{t('contactForm.message.label')}</Label>
                                            <Textarea
                                                id="message"
                                                placeholder={t('contactForm.message.placeholder')}
                                                className="min-h-[150px] bg-white/50 dark:bg-gray-800/50"
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            By submitting this form, you agree to our <a href="#" className="text-primary hover:underline">Privacy Policy</a> and <a href="#" className="text-primary hover:underline">Terms of Service</a>.
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                            size="lg"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-5 w-5" />
                                                    {t('contactForm.submit')}
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}