"use client"

import { useState, useEffect } from 'react'
import { Facebook, Instagram, Twitter } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { useTranslation } from 'react-i18next'
import '@/i18n'

const Footer = () => {
  const { t } = useTranslation(['footer'])

  return (
    <footer className="bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:about.title')}</h3>
            <p className="text-muted-foreground">
              {t('footer:about.description')}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  {t('footer:quickLinks.aboutUs')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  {t('footer:quickLinks.contact')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  {t('footer:quickLinks.blog')}
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-muted-foreground hover:text-primary">
                  {t('footer:quickLinks.faqs')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:customerService.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-primary">
                  {t('footer:customerService.shipping')}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-primary">
                  {t('footer:customerService.returns')}
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-muted-foreground hover:text-primary">
                  {t('footer:customerService.sizeGuide')}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
                  {t('footer:customerService.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:connect.title')}</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            
            <div className="space-y-4">

              
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('footer:connect.newsletter.title')}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('footer:connect.newsletter.description')}
                </p>
                <form className="flex gap-2">
                  <input
                    type="email"
                    placeholder={t('footer:connect.newsletter.placeholder')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button type="submit" variant="default">
                    {t('footer:connect.newsletter.button')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {t('footer:copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary">{t('footer:legal.terms')}</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-primary">{t('footer:legal.privacy')}</Link>
              <span>•</span>
              <Link href="/cookies" className="hover:text-primary">{t('footer:legal.cookies')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer