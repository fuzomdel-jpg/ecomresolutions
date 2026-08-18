import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema } from "@/lib/seo/schema";
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
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://ecomresolutions.com"),
  title: {
    default: "Fix Amazon, Walmart, Shopify & Merchant Center Listing Problems | Ecom Resolutions",
    template: "%s | Ecom Resolutions",
  },
  description:
    "Diagnose and fix Amazon listing suppression, Walmart products not publishing, Shopify variant issues, Google Merchant Center disapprovals, and TikTok Shop rejections.",
  icons: {
    icon: "/brand/mark.svg",
    shortcut: "/brand/mark.svg",
  },
  openGraph: {
    title: "What's wrong with your store?",
    description: "Fixed-price expert resolution for Amazon, Walmart, Shopify, Google Merchant Center and TikTok Shop.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <JsonLd data={organizationSchema()} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
