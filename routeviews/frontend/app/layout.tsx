import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore
import './globals.css';
import { Header } from '@/components/Header';
import { AiCompanion } from '@/components/AiCompanion';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ConfirmProvider } from '@/components/Confirm';
import { AppFooter } from '@/components/AppFooter';
import { ClientWrapper } from '@/components/ClientWrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ConnectRwanda AI — Intelligent Mobility',
  description: 'AI-powered public transport, accessibility, and journey intelligence for Rwanda.',
};

export const viewport: Viewport = {
  themeColor: '#14213D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Added suppressHydrationWarning to <html>
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/tokens.css" />
      </head>
      {/* Added suppressHydrationWarning to <body> */}
      <body suppressHydrationWarning className="min-h-screen bg-canvas text-ink font-sans antialiased flex flex-col">
        <I18nProvider>
          <AuthProvider>
            <ConfirmProvider>
              
              <ClientWrapper
                header={<Header />}
                footer={<AppFooter />}
              >
                {children}
              </ClientWrapper>

              <AiCompanion />
            </ConfirmProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}