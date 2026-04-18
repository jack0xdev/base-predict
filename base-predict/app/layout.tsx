import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Predict — Daily Creator Coin Prediction Game",
  description:
    "Predict which Base creator coin pumps the most in 24 hours. Build streaks, earn points, climb the leaderboard.",
  openGraph: {
    title: "Base Predict",
    description: "Daily creator coin prediction game on Base",
    siteName: "Base Predict",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Predict",
    description: "Daily creator coin prediction game on Base",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-noise bg-atmosphere min-h-dvh">
        <Providers>
          <div className="relative z-[1] flex flex-col min-h-dvh pb-16 md:pb-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
