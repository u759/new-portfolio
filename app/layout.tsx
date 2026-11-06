import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { PortfolioShell } from '@/app/portfolio-shell';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/content';
import { getFileSystem } from '@/lib/content-source';
// @ts-ignore
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ayng.dev'),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#ffffff] text-[#1a1a1a] font-sans antialiased overflow-hidden">
        <PortfolioShell fileSystem={getFileSystem()}>{children}</PortfolioShell>
      </body>
    </html>
  );
}
