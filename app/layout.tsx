import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { SecurityProvider } from './security';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'Vatandaş Kontrol',
  description: 'OSINT Investigation Game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${orbitron.variable} bg-slate-950 text-white antialiased overflow-hidden notranslate no-translate`}>
        <SecurityProvider>
            {children}
        </SecurityProvider>
      </body>
    </html>
  );
}

