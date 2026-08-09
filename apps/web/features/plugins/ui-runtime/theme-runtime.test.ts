import test from "node:test";
import assert from "node:assert/strict";

import {
  compilePluginTheme,
  parsePluginRuntimeTheme,
  pluginThemeCssVariables,
} from "./theme-runtime.ts";

test("compiles theme JSON5 into normalized runtime JSON", () => {
  const compiled = compilePluginTheme(`
    {
      schema: "mcsl.theme.v1",
      colors: {
        accent: "#0070C0",
        background: "#101820",
        textPrimary: "#F8FAFC",
      },
      spacing: { sm: 6, md: 12, lg: 20 },
    }
  `);

  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;
  assert.doesNotThrow(() => JSON.parse(compiled.runtimeJson));
  const parsed = parsePluginRuntimeTheme(compiled.runtimeJson);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.theme.colors.accent, "#0070c0");
    assert.equal(parsed.theme.spacing.md, 12);
  }
});

test("rejects unsafe or unknown theme tokens", () => {
  const parsed = parsePluginRuntimeTheme(
    JSON.stringify({
      schema: "mcsl.theme.v1",
      colors: { accent: "javascript:red", brand: "#ffffff" },
      spacing: { huge: 1000, md: 12.5 },
    }),
  );

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(
      parsed.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /theme_color_invalid|theme_color_unknown|theme_spacing_unknown|theme_spacing_invalid/,
    );
  }
});

test("maps theme tokens to stable CSS variables", () => {
  const parsed = parsePluginRuntimeTheme(
    JSON.stringify({
      schema: "mcsl.theme.v1",
      colors: { accent: "#0070c0", textPrimary: "#ffffff" },
      spacing: { sm: 4, md: 8 },
    }),
  );

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(pluginThemeCssVariables(parsed.theme), {
    "--mcsl-extension-color-accent": "#0070c0",
    "--mcsl-extension-color-text-primary": "#ffffff",
    "--mcsl-extension-spacing-sm": "4px",
    "--mcsl-extension-spacing-md": "8px",
  });
});
