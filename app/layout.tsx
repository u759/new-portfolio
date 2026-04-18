import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
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
  title: 'Ayden Nguyen',
  description: 'A minimalist, modern portfolio website in the form of a file browser',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#ffffff] text-[#1a1a1a] font-sans antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
