import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider"; // <-- 1. Import Provider

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PEA Ranod Material Locator",
  description: "ระบบค้นหาตำแหน่งพัสดุ กฟภ.ระโนด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 2. ครอบ children ด้วย QueryProvider */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}