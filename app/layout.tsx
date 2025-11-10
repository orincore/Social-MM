import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/lib/auth-provider';
import SiteFooter from '@/components/site-footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Social OS - Multi-Platform Social Media Management',
  description: 'Manage your Instagram, Facebook, and YouTube content from one dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
