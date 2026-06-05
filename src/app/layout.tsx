import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PULSE PARRY",
  description: "360° rhythm parry survivor — vibe coding hackathon entry",
};

// Lock scaling so the canvas game fills the device and pinch-zoom/scroll can't
// fight touch controls during play.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05030a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={geistMono.variable}>
      <body>{children}</body>
    </html>
  );
}
