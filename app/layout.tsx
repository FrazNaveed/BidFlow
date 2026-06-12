import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BidFlow — AI Bid & Proposal Response Platform",
    template: "%s | BidFlow",
  },
  description:
    "Parse RFPs, match capabilities, draft compliant proposals, and score win probability — all in one platform for bid teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white`}>{children}</body>
    </html>
  );
}
