import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "বাজার দর | আজকের বাজারের দাম",
  description:
    "চাল, ডাল, তেল, সবজি, মাছ ও মাংসের আজকের দাম এক নজরে।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}