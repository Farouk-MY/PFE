"use client"

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Code, Globe, Award, Users, Zap, Database, Smartphone, ChevronRight, Building, Cloud, Shield } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

// Define types for translation data
interface ValueItem {
  title: string
  description: string
}

interface ServiceItem {
  title: string
  description: string
}

interface MilestoneItem {
  year: string
  title: string
  description: string
}

interface TeamMember {
  name: string
  role: string
  bio: string
}

// Define team member images
const teamImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
]

export default function AboutPage() {
  const { t } = useTranslation('about')

  // Define the icons for values section
  const valueIcons = [
    <Zap key="innovation" className="h-6 w-6 text-blue-600" />,
    <Shield key="quality" className="h-6 w-6 text-purple-600" />,
    <Users key="partnership" className="h-6 w-6 text-emerald-600" />,
    <Globe key="local" className="h-6 w-6 text-amber-600" />,
  ]

  // Define the icons for milestones section
  const milestoneIcons = [
    <Building key="founded" className="h-6 w-6" />,
    <Code key="project" className="h-6 w-6" />,
    <Smartphone key="mobile" className="h-6 w-6" />,
    <Cloud key="cloud" className="h-6 w-6" />,
    <Award key="recognition" className="h-6 w-6" />,
  ]

  // Service icons
  const serviceIcons = [
    <Code className="h-8 w-8 text-blue-600 mb-4" />,
    <Smartphone className="h-8 w-8 text-purple-600 mb-4" />,
    <Database className="h-8 w-8 text-emerald-600 mb-4" />,
  ]

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4">{t('badge')}</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('hero.subtitle')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
              >
                <Badge className="mb-4">{t('story.badge')}</Badge>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {t('story.title')}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  {(t('story.paragraphs', { returnObjects: true }) as string[]).map((paragraph: string, index: number) => (
                      <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8">
                  <Button className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    {t('story.button')}
                  </Button>
                </div>
              </motion.div>
              <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative"
              >
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800"
                      alt="MediaSoft team"
                      className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 w-2/3">
                  <p className="text-white font-medium">
                    "{t('story.quote')}"
                  </p>
                  <p className="text-white/80 text-sm mt-2">
                    {t('story.author')}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-24 bg-black/5 backdrop-blur-xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4">{t('values.badge')}</Badge>
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('values.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('values.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(t('values.items', { returnObjects: true }) as ValueItem[]).map((value: ValueItem, index: number) => (
                  <motion.div
                      key={value.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                  >
                    <Card className="p-6 h-full bg-white/50 backdrop-blur-xl hover:shadow-lg transition-shadow">
                      <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                        {valueIcons[index]}
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </Card>
                  </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4">{t('services.badge')}</Badge>
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('services.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('services.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(t('services.items', { returnObjects: true }) as ServiceItem[]).map((service: ServiceItem, index: number) => (
                  <Card key={service.title} className={`p-6 ${
                      index === 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' :
                          index === 1 ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' :
                              'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
                  }`}>
                    {serviceIcons[index]}
                    <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones Section */}
        <section className="py-24 bg-black/5 backdrop-blur-xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4">{t('milestones.badge')}</Badge>
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('milestones.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('milestones.subtitle')}
              </p>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-blue-600 to-purple-600"></div>

              <div className="space-y-12">
                {(t('milestones.items', { returnObjects: true }) as MilestoneItem[]).map((milestone: MilestoneItem, index: number) => (
                    <motion.div
                        key={milestone.year}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                        <div className={`${index % 2 === 0 ? 'ml-auto' : 'mr-auto'} w-fit`}>
                          <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                          <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                          <p className="text-muted-foreground">{milestone.description}</p>
                        </div>
                      </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2">
                          {milestoneIcons[index]}
                        </div>
                      </div>
                      <div className="w-1/2"></div>
                    </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4">{t('team.badge')}</Badge>
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('team.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('team.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(t('team.members', { returnObjects: true }) as TeamMember[]).map((member: TeamMember, index: number) => (
                  <motion.div
                      key={member.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden h-full bg-white/50 backdrop-blur-xl hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden">
                        <img
                            src={teamImages[index]}
                            alt={member.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        <p className="text-primary font-medium mb-3">{member.role}</p>
                        <p className="text-muted-foreground text-sm">{member.bio}</p>
                      </div>
                    </Card>
                  </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-6">{t('cta.title')}</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-8">
                {t('cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" className="rounded-full text-primary border-white hover:text-white hover:bg-white/10" asChild>
                  <Link href="/contact">
                    {t('cta.buttons.contact')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
  )
}