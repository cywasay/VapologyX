import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { BRAND, MINIMUM_AGE } from "@/lib/products";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: `${BRAND} | Devices, Disposables, Bottles & Coils`, template: `%s | ${BRAND}` },
  description: `Demo storefront for adults ${MINIMUM_AGE}+. Sample products only.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
