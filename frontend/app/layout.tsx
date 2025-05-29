import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/footer';
import { Chatbot } from '@/components/chat-bot';
import React from "react";
import ClientLayout from '@/components/client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LuxeCart - Premium Shopping Experience',
  description: 'Your premium shopping destination for luxury goods',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster />
      </LanguageProvider>
      </ThemeProvider>
      </body>
      </html>
  );
}