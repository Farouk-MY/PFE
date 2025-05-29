'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Chatbot } from '@/components/chat-bot';

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');

    return (
        <div className="min-h-screen flex flex-col">
            {!isAdminRoute && <Header />}
            <main className="flex-grow">{children}</main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <Chatbot />}
        </div>
    );
}