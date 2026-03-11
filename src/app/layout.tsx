import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공공데이터 대시보드",
  description: "한국 공공 데이터 기반 실시간 대기질, 날씨, 교통 정보 대시보드",
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
