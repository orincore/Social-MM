import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import AuthProvider from '@/lib/auth-provider';
import SiteFooter from '@/components/site-footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://social-os.example.com';
const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Social OS',
  url: baseUrl,
  logo: `${baseUrl}/og-image.png`,
  sameAs: [
    'https://www.instagram.com/orincore',
    'https://www.youtube.com/@orincore',
    'https://www.facebook.com/orincore'
  ]
};

const softwareStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Social OS',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '182'
  },
  offers: {
    '@type': 'Offer',
    price: '149',
    priceCurrency: 'INR',
    availability: 'https://schema.org/OnlineOnly'
  },
  featureList: [
    'Cross-platform content scheduling',
    'AI caption and content generation',
    'Real-time analytics dashboard',
    'Automated publishing workflows'
  ],
  url: baseUrl
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Social OS | AI-Powered Social Media Management Platform',
    template: '%s | Social OS'
  },
  description:
    'Plan, schedule, and publish Instagram, Facebook, and YouTube content with AI-driven analytics, automation, and collaboration tools.',
  keywords: [
    'social media management platform',
    'instagram scheduling tool',
    'facebook page management',
    'youtube analytics dashboard',
    'ai content generator',
    'social media calendar software',
    'multi platform social media tool',
    'content publishing automation'
  ],
  openGraph: {
    title: 'Social OS | Multi-Platform Social Media Operating System',
    description:
      'Automate Instagram, Facebook, and YouTube content with AI captions, scheduling, analytics, and publishing from one unified dashboard.',
    url: '/',
    siteName: 'Social OS',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social OS | AI Social Media Management Suite',
    description:
      'Grow faster with AI-powered scheduling, analytics, and publishing for Instagram, Facebook, and YouTube.',
    creator: '@orin_core'
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  other: {
    'og:image': `${baseUrl}/og-image.png`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script id="schema-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify([organizationStructuredData, softwareStructuredData])}
        </Script>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
