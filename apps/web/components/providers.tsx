"use client";

import type { ReactNode } from "react";

import { FeedbackProvider } from "@/components/ui-feedback";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/auth-provider";
import { DownloadProvider } from "@/features/downloads/download-provider";
import { LocaleProvider } from "@/features/i18n/locale-provider";
import { DaemonProvider } from "@/features/nodes/daemon-provider";
import { ThemeProvider } from "@/features/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <DaemonProvider>
              <DownloadProvider>{children}</DownloadProvider>
            </DaemonProvider>
          </AuthProvider>
          <Toaster />
        </FeedbackProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
