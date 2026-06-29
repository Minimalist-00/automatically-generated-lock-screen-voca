import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import QuickAddFAB from "@/components/QuickAddFAB";
import { StoreProvider } from "@/contexts/StoreContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
export const metadata: Metadata = {
  title: "VocaLock",
  description: "Generate custom lock screen wallpapers containing daily vocabulary cards to learn words effortlessly every time you unlock your phone.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "VocaLock",
    statusBarStyle: "default",
  },
  applicationName: "VocaLock",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EAF5F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className="min-h-dvh flex flex-col text-[var(--foreground)] font-sans selection:bg-[#92D0C6]/30 bg-[var(--background)]">
        <ThemeProvider>
          <StoreProvider>
            <Toaster position="top-center" />
            <Navigation />
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10">
              {children}
            </main>
            <QuickAddFAB />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

