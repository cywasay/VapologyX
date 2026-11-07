import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
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
  metadataBase: new URL(siteUrl()),
  title: { default: `${BRAND} | Devices, Disposables, Bottles & Coils`, template: `%s | ${BRAND}` },
  description: `Demo storefront for adults ${MINIMUM_AGE}+. Sample products only.`,
  openGraph: { siteName: BRAND, type: "website" },
  // Still a demo, so search engines are told to stay away. Remove this line when the shop goes live.
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
