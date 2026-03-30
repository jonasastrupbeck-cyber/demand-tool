import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Demand Analysis Tool",
    description: "Vanguard Method demand gathering and analysis",
    verification: {
          google: "ew5JFMGnoS1vhlMMIRI1rR3FP_tnORX0dbhZWpJoMdI",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
          <html lang="en" className={`${geistSans.variable} h-full`}>
                  <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
                          <LocaleProvider>{children}</LocaleProvider>LocaleProvider>
                  </body>body>
          </html>html>
        );
}</body>
