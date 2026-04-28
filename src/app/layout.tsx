import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const THEME_INIT = `
(function(){
  try {
    var k = 'dn-travel-theme';
    var t = localStorage.getItem(k);
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`;

export const metadata: Metadata = {
  title: "Đà Nẵng Travel — Dự báo thời tiết & Lịch trình du lịch",
  description: "Khám phá Đà Nẵng với bản đồ tương tác, dự báo thời tiết và lên lịch trình du lịch thông minh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
