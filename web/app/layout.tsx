import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeContext";
import Navbar from "../components/Navbar";
import DemoModeModal from "../components/DemoModeModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VAYU-CPI | Real-Time Airfare Price Index & Control Center for India",
  description: "Real-Time Airfare Price Index for India - MoSPI Macro CPI & DGCA Surge Anomaly Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col transition-colors duration-300`}>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
            {children}
          </main>
          <DemoModeModal />
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>VAYU-CPI • Real-Time Airfare Price Index for India</span>
              <span>Ministry of Statistics (MoSPI) & DGCA • Base 2024 = 100</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
