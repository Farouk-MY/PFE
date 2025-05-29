"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MessageCircle, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import '@/i18n'

export default function FAQsPage() {
  const { t } = useTranslation(['faq'])
  const { language } = useLanguage()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get categories from translation file
  const categories = Object.keys(t('categories', '', { returnObjects: true }) || {})
    .filter(key => key !== 'allCategories')

  // Get FAQ data from translation file
  const getFaqData = () => {
    const categoriesData = t('categories', '', { returnObjects: true }) || {}
    const result: Record<string, Array<{question: string, answer: string}>> = {}
    
    Object.entries(categoriesData).forEach(([key, value]) => {
      if (key !== 'allCategories' && typeof value === 'object') {
        const categoryData = value as { title: string, questions: Array<{question: string, answer: string}> }
        result[categoryData.title] = categoryData.questions
      }
    })
    
    return result
  }

  const faqs = getFaqData()

  const filteredFaqs = selectedCategory
    ? { [selectedCategory]: faqs[selectedCategory] }
    : faqs

  const searchResults = Object.entries(filteredFaqs).reduce((acc, [category, questions]) => {
    const filteredQuestions = questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filteredQuestions.length > 0) {
      acc[category] = filteredQuestions
    }
    return acc
  }, {} as typeof faqs)

  return (
    <div className="min-h-screen py-16">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1920)',
              filter: 'brightness(0.3)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
              {t('hero.description')}
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-black/5 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
            >
              {t('categories.allCategories')}
            </Button>
            {categories.map((categoryKey) => {
              const categoryTitle = t(`categories.${categoryKey}.title`)
              return (
                <Button
                  key={categoryKey}
                  variant={selectedCategory === categoryTitle ? "default" : "outline"}
                  onClick={() => setSelectedCategory(categoryTitle)}
                  className="whitespace-nowrap"
                >
                  {categoryTitle}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {Object.entries(searchResults).length > 0 ? (
                Object.entries(searchResults).map(([category, questions]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="mb-8"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <Badge variant="secondary">
                        {questions.length} {questions.length === 1 ? t('questionSingular', 'Question') : t('questionPlural', 'Questions')}
                      </Badge>
                    </div>
                    <Accordion type="single" collapsible className="space-y-4">
                      {questions.map((faq, index) => (
                        <AccordionItem key={index} value={`${category}-${index}`}>
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
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {t('search.noResults')} "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>                    
                    {t('search.clearButton')}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    {t('search.tryAgain')}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Support */}
            <div>
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-xl font-bold mb-4">{t('contact.title')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('contact.description')}
                  </p>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t('contact.liveChat')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      {t('contact.emailSupport')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      {t('contact.callUs')}
                    </Button>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-2">{t('contact.supportHours')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('contact.weekdayHours')}<br />
                      {t('contact.weekendHours')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}