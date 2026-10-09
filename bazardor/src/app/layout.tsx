import type { Metadata } from "next";
import "./globals.css";
import AppToaster from "@/components/app-toaster";

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
    <html lang="bn" data-scroll-behavior="smooth">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}