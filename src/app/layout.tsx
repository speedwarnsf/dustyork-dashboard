import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "D's Project Command Center",
    template: "%s | D's Command Center",
  },
  description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
  metadataBase: new URL("https://dustyork.com"),
  openGraph: {
    title: "D's Project Command Center",
    description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
    url: "https://dustyork.com",
    siteName: "D's Command Center",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "D's Project Command Center",
    description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
