import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "CommitPay AI — Convert Leads with Intelligent Sales Bots",
    description:
        "Deploy AI-powered sales chatbots that convert visitors into paying customers. Built for service businesses in Singapore.",
    openGraph: {
        title: "CommitPay AI — Convert Leads with Intelligent Sales Bots",
        description:
            "Deploy AI-powered sales chatbots that convert visitors into paying customers.",
        type: "website",
        locale: "en_SG",
        siteName: "CommitPay AI",
    },
    twitter: {
        card: "summary",
        title: "CommitPay AI — Convert Leads with Intelligent Sales Bots",
        description:
            "Deploy AI-powered sales chatbots that convert visitors into paying customers.",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Material Symbols Outlined — used across dashboard, portal, CRM, login */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
                {/* Inter — primary UI font for all protected pages */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-[#f8f7f5] font-sans text-slate-900 antialiased min-h-screen`}
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {children}
            </body>
        </html>
    );
}
