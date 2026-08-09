"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConsolePage,
  ConsolePageHeader,
  ConsolePanel,
} from "@/components/templates/console-surface";
import {
  buildMockMpxArchive,
  MOCK_MPX_PACKAGE,
} from "@/features/plugins/ui-runtime/mock-mpx-package";
import {
  validateMpxPackage,
  type MpxPackageDiagnostic,
} from "@/features/plugins/ui-runtime/mpx-validator";
import {
  PluginUiRenderer,
  type PluginUiEvent,
} from "@/features/plugins/ui-runtime/web-renderer";
import {
  ClientExtensionManager,
  IndexedDbClientExtensionPayloadStore,
  LocalStorageClientExtensionCacheStore,
  MemoryClientExtensionPayloadStore,
  type ClientExtensionCacheEntry,
} from "@/features/plugins/ui-runtime/client-extension-manager";
import {
  createPreviewExtensionTransport,
  dispatchClientExtensionCommand,
} from "@/features/plugins/ui-runtime/client-extension-runtime";

interface PreviewEventRecord {
  readonly event: PluginUiEvent;
  readonly dispatchStatus?: string;
}

export function PluginPreviewClient() {
  const [entry, setEntry] = useState<ClientExtensionCacheEntry | null>(null);
  const [diagnostics, setDiagnostics] = useState<
    readonly MpxPackageDiagnostic[] | null
  >(null);
  const [state, setState] = useState(MOCK_MPX_PACKAGE.initialState);
  const [events, setEvents] = useState<PreviewEventRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function installPreviewPackage() {
      const store = new LocalStorageClientExtensionCacheStore(
        window.localStorage,
        "mcsl.preview-extension.",
      );
      const payloadStore =
        typeof window.indexedDB === "undefined"
          ? new MemoryClientExtensionPayloadStore()
          : new IndexedDbClientExtensionPayloadStore(
              "mcsl-preview-extension-cache",
            );
      const manager = new ClientExtensionManager(store, payloadStore);
      await manager.restore();

      const archive = await buildMockMpxArchive();
      const validation = await validateMpxPackage(archive);
      if (!validation.ok) {
        if (!cancelled) setDiagnostics(validation.diagnostics);
        return;
      }

      const install = await manager.installPersisted(
        validation.package,
        archive,
      );
      if (!install.ok) {
        if (!cancelled) {
          setDiagnostics([
            {
              code: install.code,
              path: "$",
              message: install.message,
            },
          ]);
        }
        return;
      }

      await manager.restore();
      if (!cancelled) {
        setDiagnostics(null);
        setEntry(
          manager.get(validation.package.manifest.package.id) ?? install.entry,
        );
      }
    }

    void installPreviewPackage().catch((error: unknown) => {
      if (cancelled) return;
      setDiagnostics([
        {
          code: "preview_archive_failed",
          path: "$",
          message: error instanceof Error ? error.message : String(error),
        },
      ]);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function recordEvent(event: PluginUiEvent, dispatchStatus?: string) {
    setEvents((current) => [{ event, dispatchStatus }, ...current].slice(0, 5));
  }

  async function handleEvent(event: PluginUiEvent) {
    recordEvent(event);
    if (entry && event.command) {
      const parsed = await dispatchClientExtensionCommand(
        entry,
        createPreviewExtensionTransport(entry),
        event,
      );
      recordEvent(
        event,
        parsed.ok
          ? "Extension Protocol dispatch accepted."
          : parsed.diagnostics.join(", "),
      );
    }

    setState((current) => {
      switch (event.handler ?? event.command?.command) {
        case "refresh":
          return {
            ...current,
            status: `Refreshed at ${new Date().toLocaleTimeString()}`,
            lastEvent: "Refresh button clicked.",
            metrics: {
              cpu: Math.min(0.95, current.metrics.cpu + 0.06),
              memory: current.metrics.memory + 64 * 1024 * 1024,
            },
          };
        case "setAutoRefresh":
          return {
            ...current,
            autoRefresh: event.value === true,
            lastEvent: `Auto refresh ${event.value === true ? "enabled" : "disabled"}.`,
          };
        case "setMode":
          return {
            ...current,
            mode: typeof event.value === "string" ? event.value : current.mode,
            lastEvent: `Mode changed to ${String(event.value)}.`,
          };
        default:
          return current;
      }
    });
  }

  return (
    <ConsolePage className="p-6">
      <ConsolePageHeader
        showTitle
        title="Plugin UI preview"
        subtitle="Installed Client Extension preview. It validates, installs, restores, and renders a mock .mpx package through the same client cache path used by runtime surfaces."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => setState(MOCK_MPX_PACKAGE.initialState)}
          >
            Reset mock state
          </Button>
        }
      />

      {entry === null && diagnostics === null ? (
        <ConsolePanel>
          <p className="text-sm text-muted-foreground">
            Installing mock .mpx package into the client extension cache...
          </p>
        </ConsolePanel>
      ) : entry?.uiSchema ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <PluginUiRenderer
            schema={entry.uiSchema}
            state={state}
            onEvent={(event) => void handleEvent(event)}
          />
          <div className="flex flex-col gap-4">
            <ConsolePanel>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Installed extension</h2>
                <Badge variant="secondary">client cache</Badge>
              </div>
              <dl className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">ID</dt>
                  <dd>{entry.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Runtime</dt>
                  <dd>{entry.manifest.runtime?.ui ?? "client-only"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Commands</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {entry.commands.map((command) => (
                      <Badge key={command.id} variant="outline">
                        {command.id}
                      </Badge>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Payload</dt>
                  <dd>
                    {Object.keys(entry.fileDigests).length} hashed file(s),{" "}
                    {entry.cachedPayloads?.length ?? 0} cached payload(s),{" "}
                    {entry.resources.length} resource(s)
                  </dd>
                </div>
              </dl>
            </ConsolePanel>

            <ConsolePanel>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Host events</h2>
                <Badge variant="secondary">preview dispatch</Badge>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                {events.length === 0 ? <p>No UI event emitted yet.</p> : null}
                {events.map((record, index) => (
                  <pre
                    key={`${record.event.handler ?? record.event.command?.command ?? "event"}-${index}`}
                    className="overflow-auto rounded-lg bg-muted p-2 text-[11px] text-foreground"
                  >
                    {JSON.stringify(record, null, 2)}
                  </pre>
                ))}
              </div>
            </ConsolePanel>
          </div>
        </div>
      ) : entry ? (
        <Alert>
          <AlertTitle>Package has no client UI target</AlertTitle>
          <AlertDescription>
            This extension is installed in the client cache, but it does not
            declare a renderable client UI schema.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Preview package failed validation</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      )}
    </ConsolePage>
  );
}
