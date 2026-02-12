import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to D's Project Command Center — your private project management dashboard.",
  openGraph: {
    title: "Sign In — D's Command Center",
    description: "Sign in to your private project management dashboard.",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
