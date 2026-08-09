import test from "node:test";
import assert from "node:assert/strict";

import {
  isPluginUiDesignToken,
  pluginUiSpacingClass,
} from "./design-tokens.ts";

test("maps spacing design tokens to stable Tailwind utility classes", () => {
  assert.equal(pluginUiSpacingClass("None", "gap"), "gap-0");
  assert.equal(pluginUiSpacingClass("Spacing.Sm", "gap"), "gap-2");
  assert.equal(pluginUiSpacingClass("Lg", "padding"), "p-5");
  assert.equal(pluginUiSpacingClass("Spacing.Xl", "padding"), "p-7");
});

test("falls back to medium spacing for unknown runtime token values", () => {
  assert.equal(pluginUiSpacingClass("Spacing.Unknown", "gap"), "gap-3");
  assert.equal(pluginUiSpacingClass(null, "padding"), "p-3");
});

test("accepts only declared design tokens", () => {
  assert.equal(isPluginUiDesignToken("Spacing.Md"), true);
  assert.equal(isPluginUiDesignToken("Color.Primary"), false);
  assert.equal(isPluginUiDesignToken("p-96"), false);
});
