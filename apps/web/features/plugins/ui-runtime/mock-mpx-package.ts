import { buildMpxPackageFromSources } from "./package-builder.ts";

const MOCK_DAEMON_PLUGIN = new TextEncoder().encode(
  "preview daemon plugin placeholder",
);

export const MOCK_MPX_UI_AUTHORING_JSON5 = `
{
  schema: "mcsl.ui.v1",
  root: {
    type: "Card",
    props: {
      Title: "{state.title}",
      Description: "{state.subtitle}",
    },
    children: [
      {
        type: "View",
        props: { Direction: "Vertical", Gap: "Spacing.Md" },
        children: [
          { type: "Text", props: { Text: "{state.status}", Variant: "Subtitle" } },
          {
            type: "View",
            props: { Direction: "Horizontal", Gap: "Spacing.Sm", Align: "Center" },
            children: [
              { type: "Button", props: { Text: "Refresh", OnClick: { Command: "refresh", Params: { mode: "{state.mode}" } } } },
              { type: "ToggleSwitch", props: { IsOn: "{state.autoRefresh}", OnChanged: "setAutoRefresh" } },
              { type: "Text", props: { Text: "Auto refresh", Variant: "Label" } },
            ],
          },
          {
            type: "Select",
            props: {
              Value: "{state.mode}",
              OnChanged: "setMode",
              Options: [
                { Value: "safe", Text: "Safe" },
                { Value: "fast", Text: "Fast" },
              ],
            },
          },
          {
            type: "Tabs",
            props: {
              Value: "overview",
              Items: [
                {
                  Value: "overview",
                  Text: "Overview",
                  Children: [
                    { type: "Text", props: { Text: "CPU {format.percent(state.metrics.cpu)}" } },
                    { type: "Text", props: { Text: "Memory {format.bytes(state.metrics.memory)}" } },
                  ],
                },
                {
                  Value: "events",
                  Text: "Events",
                  Children: [
                    { type: "Text", props: { Text: "{state.lastEvent}" } },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
}
`;

export const MOCK_MPX_INITIAL_STATE = {
  title: "Instance Health Preview",
  subtitle: "Mock .mpx renderer using React + shadcn/ui",
  status: "Ready. This preview simulates Host API events only.",
  autoRefresh: false,
  mode: "safe",
  lastEvent: "No event yet.",
  metrics: {
    cpu: 0.27,
    memory: 512 * 1024 * 1024,
  },
};

export const MOCK_MPX_PACKAGE = {
  manifest: {
    package: {
      id: "mcsl.preview.instance-health",
      version: "0.1.0",
      publisher: "mcsl.preview",
      displayName: "Instance Health Preview",
    },
    runtime: {
      ui: "[1.0.0,2.0.0)",
      daemonApi: "[1.0.0,2.0.0)",
    },
    permissions: {
      host: ["ui.state", "daemon.instance.query"],
      events: [],
      network: [],
      storage: { privateBytes: 1024 },
    },
    extensionPoints: [
      { kind: "command", id: "command.daemon", target: "daemon" },
    ] as const,
    commands: [
      {
        id: "refresh",
        title: "Refresh",
        description: "Refreshes the preview status panel.",
        target: "daemon",
      },
    ] as const,
  },
  initialState: MOCK_MPX_INITIAL_STATE,
  uiAuthoringJson5: MOCK_MPX_UI_AUTHORING_JSON5,
};

export async function buildMockMpxArchive(): Promise<Uint8Array> {
  const result = await buildMpxPackageFromSources({
    package: MOCK_MPX_PACKAGE.manifest.package,
    runtime: MOCK_MPX_PACKAGE.manifest.runtime,
    uiAuthoringJson5: MOCK_MPX_UI_AUTHORING_JSON5,
    permissions: MOCK_MPX_PACKAGE.manifest.permissions,
    extensionPoints: MOCK_MPX_PACKAGE.manifest.extensionPoints,
    commands: MOCK_MPX_PACKAGE.manifest.commands,
    daemonPlugin: MOCK_DAEMON_PLUGIN,
  });

  if (!result.ok) throw new Error(result.diagnostics.join("\n"));
  return result.bytes;
}
