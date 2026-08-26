import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Plane, BarChart3, Shield, Activity } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VAYU-CPI | Real-Time Airfare Price Index for India",
  description: "Real-Time Airfare Price Index for India (SIH26056) - MoSPI Macro CPI & DGCA Anomaly Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                  <Plane className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">VAYU-CPI</span>
                  <span className="hidden md:inline ml-2 px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">SIH26056</span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
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

                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>LIVE SYSTEM</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
          VAYU-CPI • Real-Time Airfare Price Index for India (Hackathon PS SIH26056) • Base 2024 = 100
        </footer>
      </body>
    </html>
  );
}
