import type { ReactNode } from "react";

import { ConsoleShell } from "@/features/console/components/console-shell";
import { RequireAuth } from "@/features/auth/require-auth";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ConsoleShell>{children}</ConsoleShell>
    </RequireAuth>
  );
}
