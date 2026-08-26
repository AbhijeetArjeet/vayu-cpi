import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Plane, BarChart3, Shield } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VAYU-CPI | Airfare Price Index",
  description: "Real-Time Airfare Price Index for India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Plane className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-xl tracking-tight">VAYU-CPI</span>
              </div>
              <div className="flex space-x-6">
                <Link href="/" className="hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-medium text-slate-300">
                  Overview
                </Link>
                <Link href="/mospi" className="hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-medium text-slate-300">
                  <BarChart3 className="h-4 w-4" />
                  MoSPI Portal
                </Link>
                <Link href="/dgca" className="hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Shield className="h-4 w-4" />
                  DGCA Matrix
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
