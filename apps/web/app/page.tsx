"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { resolveUnauthedDestination } from "@/lib/auth-routing";
import { TEMP_DISABLE_ROUTE_GUARDS } from "@/lib/dev-flags";

export default function HomePage() {
  const router = useRouter();
  const { ready, token } = useAuth();

  useEffect(() => {
    if (TEMP_DISABLE_ROUTE_GUARDS) {
      router.replace("/dashboard/");
      return;
    }
    if (!ready) return;
    if (token) {
      router.replace("/dashboard/");
      return;
    }
    void resolveUnauthedDestination().then((dest) => {
      router.replace(dest);
    });
  }, [ready, token, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
