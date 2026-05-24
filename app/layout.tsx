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
  title: {
    default: "智能招聘匹配平台",
    template: "%s | 智能招聘匹配平台",
  },
  description: "输入学历、薪资、城市和岗位关键词，智能匹配适合你的职位",
  applicationName: "智能招聘匹配平台",
  keywords: [
    "智能招聘",
    "职位匹配",
    "求职",
    "招聘平台",
    "中国招聘",
    "岗位推荐",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "智能招聘匹配平台",
    description: "输入学历、薪资、城市和岗位关键词，智能匹配适合你的职位",
    siteName: "智能招聘匹配平台",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
