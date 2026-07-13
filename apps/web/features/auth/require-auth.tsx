"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { resolveUnauthedDestination } from "@/lib/auth-routing";
import { TEMP_DISABLE_ROUTE_GUARDS } from "@/lib/dev-flags";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, token, user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (TEMP_DISABLE_ROUTE_GUARDS) return;
    if (!ready) return;
    if (!token) {
      void resolveUnauthedDestination().then((dest) => {
        router.replace(dest);
      });
      return;
    }
    if (!user) {
      void refreshUser().then((info) => {
        if (!info) {
          void resolveUnauthedDestination().then((dest) => {
            router.replace(dest);
          });
        }
      });
    }
  }, [ready, token, user, refreshUser, router]);

  if (TEMP_DISABLE_ROUTE_GUARDS) {
    return children;
  }

  if (!ready || !token || !user) {
    return (
      <div className="flex min-h-[50vh] flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return children;
}
