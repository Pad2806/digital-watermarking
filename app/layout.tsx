import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Roboto, Playfair_Display, Montserrat, Dancing_Script } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-roboto" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "Watermark Pro",
  description: "Secure your images with customizable watermarks.",
  icons: {
    icon: "/pad.png",
    shortcut: "/pad.png",
    apple: "/pad.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        inter.className,
        inter.variable,
        roboto.variable,
        playfair.variable,
        montserrat.variable,
        dancing.variable,
        geistSans.variable,
        geistMono.variable,
        "antialiased"
      )}>
        {children}
      </body>
    </html>
  );
}
