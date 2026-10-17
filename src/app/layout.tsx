import type {Metadata} from 'next';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://polaristaxservices.com'),
  title: {
    default: 'Polaris Tax Services | Professional Tax Planning & Filing',
    template: '%s | Polaris Tax Services',
  },
  description: 'Simplify your individual and business taxes with certified CPAs and tax advisors at Polaris Tax Services. 100% accuracy and maximum refunds.',
  keywords: ['tax services', 'CPA tax filing', 'small business taxes', 'individual tax return', 'IRS tax audit support', '2026 tax brackets'],
  authors: [{ name: 'Polaris Tax Services' }],
  creator: 'Polaris Tax Services',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://polaristaxservices.com',
    siteName: 'Polaris Tax Services',
    title: 'Polaris Tax Services | Professional Tax Planning & Filing',
    description: 'Simplify your taxes with professional ease. Certified CPAs, maximum refund guarantee, and comprehensive audit defense.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polaris Tax Services | Professional Tax Planning & Filing',
    description: 'Simplify your taxes with professional ease.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
