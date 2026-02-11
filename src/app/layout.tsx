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
  title: "D's Project Command Center",
  description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
  openGraph: {
    title: "D's Project Command Center",
    description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "D's Project Command Center",
    description: "Personal project dashboard with GitHub intelligence, milestones, and activity tracking.",
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
