import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JINA",
  description: "한국 공공 데이터 기반 실시간 대기질, 날씨, 교통 정보 대시보드",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%236366f1'/><stop offset='100%25' stop-color='%233b82f6'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='url(%23g)'/><path d='M25 70V45h10v25H25zm20-50v50H35V20h10zm20 25v25H55V45h10zm0-25v10H55V20h10z' fill='white'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
