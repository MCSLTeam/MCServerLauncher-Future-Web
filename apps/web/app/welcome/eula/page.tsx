"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { resolveUnauthedDestination } from "@/lib/auth-routing";
import { loadEulaContent } from "@/lib/eula";
import { isFirstLoad, markFirstLoadComplete } from "@/lib/first-load";

export default function WelcomeEulaPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { ready, token } = useAuth();
  const [content, setContent] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/dashboard/");
      return;
    }
    if (!isFirstLoad()) {
      void resolveUnauthedDestination().then((dest) => router.replace(dest));
      return;
    }
    queueMicrotask(() => setChecking(false));
  }, [ready, token, router]);

  useEffect(() => {
    if (checking) return;
    let cancelled = false;
    void loadEulaContent(locale).then((text) => {
      if (!cancelled) {
        setContent(text || t("shared.eula.content"));
        setCountdown(10);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [checking, locale, t]);

  useEffect(() => {
    if (content === null) return;
    const id = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [content]);

  function accept() {
    markFirstLoadComplete();
    void resolveUnauthedDestination().then((dest) => {
      router.replace(dest);
    });
  }

  function reject() {
    // Web 端无法可靠关闭标签页时，进入空白提示页语义
    try {
      window.close();
    } catch {
      // ignore
    }
    window.location.replace("about:blank");
  }

  if (checking) return null;

  return (
    <Reveal className="w-full max-w-3xl">
      <Card className="max-h-[min(40rem,calc(100dvh-4rem))]">
        <CardHeader>
          <CardTitle asChild>
            <h1>{t("shared.eula.title")}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden">
          <div className="mcsl-scrollbar max-h-[min(24rem,50dvh)] overflow-y-auto rounded-xl border bg-muted/30 p-4 text-sm leading-7">
            {content === null ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={(url) => {
                  try {
                    const parsed = new URL(url, "https://localhost.invalid");
                    return ["http:", "https:", "mailto:"].includes(
                      parsed.protocol,
                    )
                      ? url
                      : "";
                  } catch {
                    return "";
                  }
                }}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 text-xl font-semibold">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-6 text-lg font-semibold first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 font-semibold">{children}</h3>
                  ),
                  p: ({ children }) => <p className="my-3">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="my-3 list-disc pl-6">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-3 list-decimal pl-6">{children}</ol>
                  ),
                  li: ({ children }) => <li className="my-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 border-l-4 border-border pl-4 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded-lg bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="mcsl-scrollbar my-4 overflow-x-auto rounded-xl bg-muted p-4">
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="mcsl-scrollbar my-4 overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border p-2 font-semibold">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border p-2 align-top">{children}</td>
                  ),
                  hr: () => <hr className="my-6 border-border" />,
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/welcome/setup/")}
          >
            {t("ui.common.prev-step")}
          </Button>
          <Button type="button" variant="secondary" onClick={reject}>
            {t("shared.eula.reject")}
          </Button>
          <Button
            type="button"
            disabled={countdown > 0 || content === null}
            onClick={accept}
          >
            {countdown > 0
              ? t("shared.eula.accept.countdown", { time: countdown })
              : t("shared.eula.accept.normal")}
          </Button>
        </CardFooter>
      </Card>
    </Reveal>
  );
}
