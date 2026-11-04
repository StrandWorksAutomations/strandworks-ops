import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { HumanDates } from "./components/HumanDates";

const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const display = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Strandworks Cockpit",
  description: "Owner-only operations cockpit",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${body.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var z=localStorage.getItem("cockpit-text-zoom");if(["1","1.12","1.25","1.4","1.6"].includes(z))document.documentElement.style.setProperty("--text-zoom",z)}catch(e){};try{var c=document.cookie.match(/(?:^|; )cockpit-theme=(light|dark)(?:;|$)/);var t=c?c[1]:localStorage.getItem("cockpit-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme="dark"}',
          }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-body)" }}>{children}<HumanDates /></body>
    </html>
  );
}
