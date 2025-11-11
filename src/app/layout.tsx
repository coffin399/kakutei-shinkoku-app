import Link from "next/link";
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

export const metadata: Metadata = {
  title: "確定申告コンパニオン",
  description:
    "納税者情報の整理から帳簿作成までをサポートするモダンな確定申告ウェブアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
              <Link href="/" className="text-sm font-semibold tracking-[0.35em] text-white/80">
                KAKUTEI SHINKOKU APP
              </Link>
              <nav className="flex items-center gap-5 text-sm text-white/70">
                <Link className="transition hover:text-white" href="/blue">
                  青色帳簿
                </Link>
                <Link className="transition hover:text-white" href="/settings/gemini">
                  Gemini 設定
                </Link>
                <Link className="transition hover:text-white" href="/outputs">
                  出力センター
                </Link>
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
