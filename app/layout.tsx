import type { Metadata } from "next";
import {
  Inter,
  Roboto,
  Playfair_Display,
  Montserrat,
  Dancing_Script,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from "next/script";



const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
});

export const metadata: Metadata = {
  title: "Watermark Pad - Digital Watermarking Tool",
  description: "Secure your images with customizable watermarks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.className,
          inter.variable,
          roboto.variable,
          playfair.variable,
          montserrat.variable,
          dancing.variable,
          "antialiased",
        )}
        suppressHydrationWarning
      >
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.dropbox.com/static/api/2/dropins.js"
          id="dropboxjs"
          data-app-key="2eslbosdtsy767p"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
