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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://renovationrestart.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Renovation Restart — Your contractor quit? Get an organized handoff report.",
    template: "%s | Renovation Restart",
  },
  description:
    "Contractor abandoned your kitchen or bathroom renovation mid-project? Upload your contract, receipts, texts, and photos and get a Restart Report: timeline, money paid vs. work done, missing paperwork, and questions for your next contractor.",
  keywords: [
    "contractor abandoned my project",
    "contractor quit mid renovation",
    "contractor disappeared",
    "unfinished renovation help",
    "kitchen renovation contractor left",
    "bathroom renovation contractor quit",
  ],
  openGraph: {
    title: "Renovation Restart — Your contractor quit? Get an organized handoff report.",
    description:
      "Upload your contract, receipts, texts, and photos. Get a Restart Report with a timeline, financial breakdown, missing documents, and questions for your next contractor.",
    url: siteUrl,
    siteName: "Renovation Restart",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Renovation Restart — Your contractor quit? Get an organized handoff report.",
    description:
      "Upload your contract, receipts, texts, and photos. Get an organized Restart Report before you hire the next contractor.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
