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
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "D's Project Command Center",
    description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://dustyork.com",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "D's Project Command Center",
              url: "https://dustyork.com",
              description:
                "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
            }),
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:bg-[#d2ff5a] focus:text-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
