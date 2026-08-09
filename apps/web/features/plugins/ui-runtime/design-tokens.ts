const SPACING_CLASS_BY_TOKEN = {
  None: { gap: "gap-0", padding: "p-0" },
  Xs: { gap: "gap-1", padding: "p-1" },
  Sm: { gap: "gap-2", padding: "p-2" },
  Md: { gap: "gap-3", padding: "p-3" },
  Lg: { gap: "gap-5", padding: "p-5" },
  Xl: { gap: "gap-7", padding: "p-7" },
  "Spacing.Xs": { gap: "gap-1", padding: "p-1" },
  "Spacing.Sm": { gap: "gap-2", padding: "p-2" },
  "Spacing.Md": { gap: "gap-3", padding: "p-3" },
  "Spacing.Lg": { gap: "gap-5", padding: "p-5" },
  "Spacing.Xl": { gap: "gap-7", padding: "p-7" },
} as const;

export type PluginUiSpacingToken = keyof typeof SPACING_CLASS_BY_TOKEN;
export type PluginUiSpacingSlot = "gap" | "padding";

export function isPluginUiDesignToken(value: string): boolean {
  return value in SPACING_CLASS_BY_TOKEN;
}

export function pluginUiSpacingClass(
  value: unknown,
  slot: PluginUiSpacingSlot,
): string {
  const token = typeof value === "string" ? value : "Md";
  if (!isPluginUiDesignToken(token)) return SPACING_CLASS_BY_TOKEN.Md[slot];
  return SPACING_CLASS_BY_TOKEN[token as PluginUiSpacingToken][slot];
}
