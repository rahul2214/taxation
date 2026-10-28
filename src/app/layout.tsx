import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Sans, Newsreader, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE, CORE_KEYWORDS, organizationSchema, websiteSchema } from '@/lib/seo';

// Self-hosted via next/font: no render-blocking request to Google and no layout shift on load.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' });
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
});
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

const defaultTitle = `${SITE.name} | CPA Tax Preparation & Filing for Individuals and Small Businesses`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    ...CORE_KEYWORDS,
    'individual tax return preparation',
    'Form 1040 preparation',
    'LLC tax filing',
    'Form 1120-S preparation',
    'Form 1065 partnership return',
    'IRS notice help',
    'CP2000 response',
    'tax planning services',
    'bookkeeping services for small business',
    'R&D tax credit',
    'enrolled agent',
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'finance',
  // No site-wide canonical here: it would be inherited by every route. Each public page sets its own.
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: '/',
    siteName: SITE.name,
    title: defaultTitle,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    title: defaultTitle,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // Set these in the environment once the properties are verified in each console.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#14202E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-US"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSans.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body className="font-body antialiased" suppressHydrationWarning>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
