import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CyberLab", template: "%s | CyberLab" },
  description: "Professional cybersecurity learning and utility platform",
  keywords: ["cybersecurity", "ethical hacking", "bug bounty", "security labs"],
  authors: [{ name: "CyberLab" }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#020617" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                  classNames: {
                    toast: "bg-surface-900 border border-surface-700 text-surface-100",
                    error: "bg-red-950/80 border-red-700/50 text-red-200",
                    success: "bg-cyber-950/80 border-cyber-700/50 text-cyber-200",
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
