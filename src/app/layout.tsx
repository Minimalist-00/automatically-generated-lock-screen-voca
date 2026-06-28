import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Lock Screen Voca - ロック画面自動生成単語帳",
  description: "毎日英単語を学習するために、ロック画面へその日の3つの単語を表示する画像を生成するアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4EBE1] text-[#2D3748] font-sans selection:bg-[#F6AD55]/30">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
