import type { Metadata, Viewport } from "next";
import { Oswald, Poppins, Sacramento } from "next/font/google";
import "./globals.css";

// Bold condensed caps for titles + hint rows.
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "600"] });
// Handwritten script for section headings.
const sacramento = Sacramento({ variable: "--font-sacramento", subsets: ["latin"], weight: "400" });
// Clean, friendly body text.
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Atara's Mystery Night In",
  description: "Unknown adventure awaits!",
};

export const viewport: Viewport = {
  themeColor: "#f6f2e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${sacramento.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
