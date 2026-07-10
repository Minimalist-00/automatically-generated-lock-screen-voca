import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import QuickAddFAB from "@/components/QuickAddFAB";
import { StoreProvider } from "@/contexts/StoreContext";
import { ThemeProvider, FONTS, COLORS } from "@/contexts/ThemeContext";
import { getSystemSettings } from "@/app/actions/systemSettings";
import { Toaster } from "sonner";
import { FontFamily, ColorTheme } from "@/types";

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
  userScalable: false,
  themeColor: "#EAF5F2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch initial theme from the database to prevent FOUC completely
  let initialTheme = { font: 'rounded' as FontFamily, color: 'mint' as ColorTheme };
  try {
    const settings = await getSystemSettings(['theme_color', 'theme_font']);
    const colorSetting = settings.find(s => s.key === 'theme_color');
    const fontSetting = settings.find(s => s.key === 'theme_font');
    if (colorSetting && COLORS[colorSetting.value]) initialTheme.color = colorSetting.value as ColorTheme;
    if (fontSetting && FONTS[fontSetting.value]) initialTheme.font = fontSetting.value as FontFamily;
  } catch (e) {
    console.error('Failed to fetch initial theme settings:', e);
  }

  // Pre-calculate CSS variables to inject them directly on the server
  const styleVariables = {
    '--font-sans': FONTS[initialTheme.font],
    fontFamily: FONTS[initialTheme.font],
    ...COLORS[initialTheme.color]
  } as React.CSSProperties;

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body style={styleVariables} className="min-h-dvh flex flex-col text-[var(--foreground)] font-sans selection:bg-[#92D0C6]/30 bg-[var(--background)] overflow-x-hidden">
        <ThemeProvider initialTheme={initialTheme}>
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

