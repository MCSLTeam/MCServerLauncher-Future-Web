import test from "node:test";
import assert from "node:assert/strict";

import { buildMpxPackageFromSources } from "./package-builder.ts";
import { validateMpxPackage } from "./mpx-validator.ts";

const UI_AUTHORING = `
{
  schema: "mcsl.ui.v1",
  root: {
    type: "Card",
    props: { Title: "{state.title}" },
    children: [{ type: "Text", props: { Text: "Ready" } }],
  },
}
`;

test("package builder normalizes JSON5 UI authoring into a valid runtime .mpx", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.builder", version: "1.0.0" },
    uiAuthoringJson5: UI_AUTHORING,
    permissions: { host: ["ui.state"], events: [], network: [] },
  });

  assert.equal(built.ok, true);
  if (built.ok) {
    assert.equal(built.manifest.targets?.client?.ui?.path, "client/ui.json");
    const validated = await validateMpxPackage(built.bytes);
    assert.equal(validated.ok, true);
    if (validated.ok)
      assert.equal(validated.package.uiSchema?.root.type, "Card");
  }
});

test("package builder emits daemon plugin target and extension point declarations", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.provider", version: "1.0.0" },
    daemonPlugin: new TextEncoder().encode("not-a-real-assembly-yet"),
    extensionPoints: [
      { kind: "provider", id: "provider.java", target: "daemon" },
    ],
  });

  assert.equal(built.ok, true);
  if (built.ok) {
    const validated = await validateMpxPackage(built.bytes);
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.deepEqual(validated.package.deploymentPlan.scopes, ["daemon"]);
      assert.equal(
        validated.package.deploymentPlan.daemon?.extensionPoints[0]?.id,
        "provider.java",
      );
    }
  }
});

test("package builder emits daemon command declarations", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.command-panel", version: "1.0.0" },
    uiAuthoringJson5: `
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "Button",
        props: {
          Text: "Refresh",
          OnClick: { Command: "refresh", Params: { mode: "{state.mode}" } },
        },
      },
    }
    `,
    daemonPlugin: new TextEncoder().encode("not-a-real-assembly-yet"),
    extensionPoints: [
      { kind: "command", id: "command.daemon", target: "daemon" },
    ],
    commands: [
      {
        id: "refresh",
        title: "Refresh",
        description: "Refreshes panel state.",
        target: "daemon",
      },
    ],
  });

  assert.equal(built.ok, true);
  if (built.ok) {
    const validated = await validateMpxPackage(built.bytes);
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.deepEqual(validated.package.deploymentPlan.scopes, [
        "client",
        "daemon",
      ]);
      assert.equal(validated.package.commands[0]?.id, "refresh");
    }
  }
});

test("package builder normalizes theme JSON5 into a valid runtime .mpx", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.theme-builder", version: "1.0.0" },
    themeJson: `{
      schema: "mcsl.theme.v1",
      colors: { accent: "#0070C0" },
      spacing: { md: 12 },
    }`,
    permissions: { host: [], events: [], network: [] },
  });

  assert.equal(built.ok, true);
  if (built.ok) {
    assert.equal(
      built.manifest.targets?.client?.theme?.path,
      "client/theme.json",
    );
    const validated = await validateMpxPackage(built.bytes);
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.equal(validated.package.theme?.colors.accent, "#0070c0");
      assert.equal(validated.package.theme?.spacing.md, 12);
    }
  }
});

test("package builder emits client-only resource extension packages", async () => {
  const icon = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.icon-pack", version: "1.0.0" },
    resources: [
      { path: "client/resources/icon.png", bytes: icon, mime: "image/png" },
    ],
    permissions: { host: [], events: [], network: [] },
  });

  assert.equal(built.ok, true);
  if (built.ok) {
    const validated = await validateMpxPackage(built.bytes);
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.deepEqual(validated.package.deploymentPlan.scopes, ["client"]);
      assert.equal(
        validated.package.deploymentPlan.client?.resources[0]?.path,
        "client/resources/icon.png",
      );
    }
  }
});

test("package builder rejects invalid authoring schema before packaging", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.invalid", version: "1.0.0" },
    uiAuthoringJson5: `{ schema: "mcsl.ui.v1", root: { type: "WebView" } }`,
  });

  assert.equal(built.ok, false);
  if (!built.ok) assert.match(built.diagnostics.join(","), /component/);
});
