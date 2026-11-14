import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  display: "swap",
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkStore | African Social Commerce",
  description: "The easiest way for Nigerian social media vendors to sell online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" style={{ colorScheme: "light" }} suppressHydrationWarning>
        <body
          className={`${jakartaSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          {children}
          <SpeedInsights/>
          <Analytics/>
        </body>
      </html>
    </ClerkProvider>
  );
}
