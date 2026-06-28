import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Lock Screen Voca",
  description: "Generate custom lock screen wallpapers containing daily vocabulary cards to learn words effortlessly every time you unlock your phone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-[#D1EAE5]">
      <body className="min-h-full flex flex-col items-center justify-center text-[var(--foreground)] font-sans selection:bg-[#92D0C6]/30 py-4">
        {/* iPhone screen emulator container: CSS pixels = Physical / 3 */}
        {/* 1206 / 3 = 402px width, 2622 / 3 = 874px height */}
        <div className="w-full max-w-[402px] h-[874px] max-h-[95dvh] bg-[var(--background)] shadow-2xl relative flex flex-col overflow-x-hidden overflow-y-auto no-scrollbar rounded-[40px] border-[8px] border-[#4A6B65]">
          <Navigation />
          <main className="flex-1 w-full px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}


