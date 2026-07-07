import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '../context/ToastContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoOps AI',
  description: 'AI Business Operating System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
