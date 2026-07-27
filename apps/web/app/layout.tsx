import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { InitialPreferencesScript } from "@/features/theme/initial-preferences-script";

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
    <html lang="zh-CN" className="font-sans" suppressHydrationWarning>
      <head>
        <InitialPreferencesScript appKey="mcsl-web" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
