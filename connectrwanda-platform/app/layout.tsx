import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'ConnectRwanda AI — Unified Mobility & Discovery',
  description: 'The unified platform for smart transit and local discovery across Rwanda.',
  icons: { icon: '/logo.svg' },
};

export const viewport: Viewport = {
  themeColor: '#022C22', // Deep emerald dark
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}