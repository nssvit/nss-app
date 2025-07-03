import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWAManager } from "@/components/PWAManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // For devices with notches
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#070709' },
    { media: '(prefers-color-scheme: dark)', color: '#070709' }
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'NSS VIT Dashboard',
    template: '%s | NSS VIT Dashboard'
  },
  description: 'National Service Scheme - VIT Dashboard for managing events, volunteers, and activities',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NSS VIT Dashboard',
    startupImage: [
      '/icon-192x192.png',
      '/icon-512x512.png',
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'NSS VIT Dashboard',
    title: 'NSS VIT Dashboard',
    description: 'National Service Scheme - VIT Dashboard for managing events, volunteers, and activities',
    images: ['/icon-512x512.png'],
  },
  twitter: {
    card: 'summary',
    title: 'NSS VIT Dashboard',
    description: 'National Service Scheme - VIT Dashboard for managing events, volunteers, and activities',
    images: ['/icon-512x512.png'],
  },
  icons: {
    shortcut: '/icon-192x192.png',
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icon-192x192.svg',
        color: '#070709',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="application-name" content="NSS VIT Dashboard" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NSS VIT Dashboard" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#070709" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-x-hidden`}
      >
        {children}
        <PWAManager />
      </body>
    </html>
  );
}
