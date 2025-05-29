import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enHeader from './locales/en/header.json';
import enFooter from './locales/en/footer.json';
import enAuth from './locales/en/auth.json';
import enContact from './locales/en/contact.json';
import enAbout from './locales/en/about.json';
import enFaq from './locales/en/faq.json';
import enStore from './locales/en/store.json';
import enAdmin from './locales/en/admin.json';
import enData from './locales/en/data.json';
import enReports from './locales/en/reports.json';
import enCategories from './locales/en/categories.json';
import enProducts from './locales/en/products.json';
import enOrders from './locales/en/orders.json';
import enDashboard from './locales/en/dashboard.json';
import enClientOrders from './locales/en/clientOrders.json';
import enPointsClient from './locales/en/points.json';
import enWishList from './locales/en/wishlist.json';
import enSecurity from './locales/en/security.json';
import frHeader from './locales/fr/header.json';
import frFooter from './locales/fr/footer.json';
import frAuth from './locales/fr/auth.json';
import frContact from './locales/fr/contact.json';
import frAbout from './locales/fr/about.json';
import frFaq from './locales/fr/faq.json';
import frStore from './locales/fr/store.json';
import frAdmin from './locales/fr/admin.json';
import frData from './locales/fr/data.json';
import frReports from './locales/fr/reports.json';
import frCategories from './locales/fr/categories.json';
import frProducts from './locales/fr/products.json';
import frOrders from './locales/fr/orders.json';
import frDashboard from './locales/fr/dashboard.json';
import frClientOrders from './locales/fr/clientOrders.json';
import frPointsClient from './locales/fr/points.json';
import frWishList from './locales/fr/wishlist.json';
import frSecurity from './locales/fr/security.json';


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        header: enHeader,
        footer: enFooter,
        auth: enAuth,
        contact: enContact,
        about: enAbout,
        faq: enFaq,
        store: enStore,
        admin: enAdmin,
        data: enData,
        reports: enReports,
        categories: enCategories,
        products: enProducts,
        orders: enOrders,
        dashboard: enDashboard,
        clientOrders: enClientOrders,
        points: enPointsClient,
        wishlist: enWishList,
        security: enSecurity,
        
        common: require('./locales/en/common.json'),
        messages: require('./locales/en/messages.json'),
        customers: require('./locales/en/customers.json')
      },
      fr: {
        header: frHeader,
        footer: frFooter,
        auth: frAuth,
        contact: frContact,
        about: frAbout,
        faq: frFaq,
        store: frStore,
        admin: frAdmin,
        data: frData,
        reports: frReports,
        categories: frCategories,
        products: frProducts,
        orders: frOrders,
        dashboard: frDashboard,
        clientOrders: frClientOrders,
        points: frPointsClient,
        wishlist: frWishList,
        security: frSecurity,
        common: require('./locales/fr/common.json'),
        messages: require('./locales/fr/messages.json'),
        customers: require('./locales/fr/customers.json')
      },
    },
    fallbackLng: 'en',
    debug: false, // Disable debug mode to prevent debug info in UI
    interpolation: {
      escapeValue: false, // not needed for React
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;