// Purpose: Root layout for the sg-tutor Next.js application. Defines global metadata,
// viewport settings, font loading, and wraps all pages with the AuthProvider.

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
// Purpose: Wrap the application tree in the Ghost State AuthProvider to guarantee a valid uid for all gamification and queue components.
import { AuthProvider } from "@/components/providers/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Purpose: SEO and PWA metadata for the SgStudyPal application.
export const metadata: Metadata = {
  title: "SgStudyPal — AI-Powered Primary School Tutoring",
  description:
    "Socratic AI tutor for Singapore MOE Primary students. Practice Math, Science, and more with guided step-by-step problem solving.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SgStudyPal",
  },
};

// Purpose: Viewport configuration for mobile PWA rendering.
export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Purpose: Register service worker for PWA installability */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
