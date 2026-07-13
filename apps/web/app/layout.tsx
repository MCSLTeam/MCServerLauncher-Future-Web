import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { InitialPreferencesScript } from "@/features/theme/initial-preferences-script";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MCServerLauncher Future",
  description: "MCServerLauncher Future · Tauri / Web",
  icons: {
    icon: [{ url: "/brand/mcsl.png?v=2", type: "image/png" }],
    shortcut: "/brand/mcsl.png?v=2",
    apple: "/brand/mcsl.png?v=2",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#081316" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <InitialPreferencesScript appKey="mcsl-web" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
