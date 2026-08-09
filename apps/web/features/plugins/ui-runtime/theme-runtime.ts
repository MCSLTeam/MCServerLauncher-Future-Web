import JSON5 from "json5";

export const THEME_SCHEMA_VERSION = "mcsl.theme.v1";

const COLOR_TOKEN_NAMES = [
  "accent",
  "background",
  "surface",
  "textPrimary",
  "textMuted",
  "success",
  "warning",
  "danger",
] as const;

const SPACING_TOKEN_NAMES = ["xs", "sm", "md", "lg", "xl"] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_THEME_JSON_BYTES = 64 * 1024;

export type PluginThemeColorToken = (typeof COLOR_TOKEN_NAMES)[number];
export type PluginThemeSpacingToken = (typeof SPACING_TOKEN_NAMES)[number];

export interface PluginThemeRuntime {
  readonly schema: typeof THEME_SCHEMA_VERSION;
  readonly colors: Readonly<Partial<Record<PluginThemeColorToken, string>>>;
  readonly spacing: Readonly<Partial<Record<PluginThemeSpacingToken, number>>>;
}

export interface PluginThemeDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type PluginThemeParseResult =
  | { readonly ok: true; readonly theme: PluginThemeRuntime }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PluginThemeDiagnostic[];
    };

export type PluginThemeCompileResult =
  | {
      readonly ok: true;
      readonly theme: PluginThemeRuntime;
      readonly runtimeJson: string;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PluginThemeDiagnostic[];
    };

export function parsePluginTheme(source: string): PluginThemeParseResult {
  if (new TextEncoder().encode(source).byteLength > MAX_THEME_JSON_BYTES) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "theme_too_large",
          "$",
          `Theme JSON exceeds ${MAX_THEME_JSON_BYTES} bytes.`,
        ),
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON5.parse(source);
  } catch (error) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "theme_parse_failed",
          "$",
          error instanceof Error ? error.message : "Theme is not valid JSON5.",
        ),
      ],
    };
  }

  return validatePluginTheme(parsed);
}

export function parsePluginRuntimeTheme(
  source: string,
): PluginThemeParseResult {
  if (new TextEncoder().encode(source).byteLength > MAX_THEME_JSON_BYTES) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "theme_too_large",
          "$",
          `Theme JSON exceeds ${MAX_THEME_JSON_BYTES} bytes.`,
        ),
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "theme_parse_failed",
          "$",
          error instanceof Error
            ? error.message
            : "Runtime theme is not valid JSON.",
        ),
      ],
    };
  }

  return validatePluginTheme(parsed);
}

export function compilePluginTheme(source: string): PluginThemeCompileResult {
  const parsed = parsePluginTheme(source);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    theme: parsed.theme,
    runtimeJson: JSON.stringify(parsed.theme),
  };
}

export function validatePluginTheme(value: unknown): PluginThemeParseResult {
  const diagnostics: PluginThemeDiagnostic[] = [];
  if (!isRecord(value)) {
    return {
      ok: false,
      diagnostics: [
        diagnostic("theme_root_invalid", "$", "Theme root must be an object."),
      ],
    };
  }

  if (value.schema !== THEME_SCHEMA_VERSION) {
    diagnostics.push(
      diagnostic(
        "theme_schema_invalid",
        "$.schema",
        `Theme schema must be '${THEME_SCHEMA_VERSION}'.`,
      ),
    );
  }

  const colors = normalizeColors(value.colors, diagnostics);
  const spacing = normalizeSpacing(value.spacing, diagnostics);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  return {
    ok: true,
    theme: {
      schema: THEME_SCHEMA_VERSION,
      colors,
      spacing,
    },
  };
}

export function pluginThemeCssVariables(
  theme: PluginThemeRuntime,
): Readonly<Record<string, string>> {
  const variables: Record<string, string> = {};
  for (const [name, value] of Object.entries(theme.colors)) {
    variables[`--mcsl-extension-color-${toKebabCase(name)}`] = value;
  }
  for (const [name, value] of Object.entries(theme.spacing)) {
    variables[`--mcsl-extension-spacing-${name}`] = `${value}px`;
  }
  return variables;
}

function normalizeColors(
  value: unknown,
  diagnostics: PluginThemeDiagnostic[],
): Readonly<Partial<Record<PluginThemeColorToken, string>>> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    diagnostics.push(
      diagnostic(
        "theme_colors_invalid",
        "$.colors",
        "colors must be an object.",
      ),
    );
    return {};
  }

  const output: Partial<Record<PluginThemeColorToken, string>> = {};
  const allowed = new Set<string>(COLOR_TOKEN_NAMES);
  for (const [key, color] of Object.entries(value)) {
    if (!allowed.has(key)) {
      diagnostics.push(
        diagnostic(
          "theme_color_unknown",
          `$.colors.${key}`,
          "Theme color token is not supported.",
        ),
      );
      continue;
    }
    if (typeof color !== "string" || !HEX_COLOR.test(color)) {
      diagnostics.push(
        diagnostic(
          "theme_color_invalid",
          `$.colors.${key}`,
          "Theme colors must be #RRGGBB hex values.",
        ),
      );
      continue;
    }

    output[key as PluginThemeColorToken] = color.toLowerCase();
  }

  return output;
}

function normalizeSpacing(
  value: unknown,
  diagnostics: PluginThemeDiagnostic[],
): Readonly<Partial<Record<PluginThemeSpacingToken, number>>> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    diagnostics.push(
      diagnostic(
        "theme_spacing_invalid",
        "$.spacing",
        "spacing must be an object.",
      ),
    );
    return {};
  }

  const output: Partial<Record<PluginThemeSpacingToken, number>> = {};
  const allowed = new Set<string>(SPACING_TOKEN_NAMES);
  for (const [key, spacing] of Object.entries(value)) {
    if (!allowed.has(key)) {
      diagnostics.push(
        diagnostic(
          "theme_spacing_unknown",
          `$.spacing.${key}`,
          "Theme spacing token is not supported.",
        ),
      );
      continue;
    }
    if (
      !Number.isInteger(spacing) ||
      Number(spacing) < 0 ||
      Number(spacing) > 96
    ) {
      diagnostics.push(
        diagnostic(
          "theme_spacing_invalid",
          `$.spacing.${key}`,
          "Theme spacing values must be integers between 0 and 96.",
        ),
      );
      continue;
    }

    output[key as PluginThemeSpacingToken] = Number(spacing);
  }

  return output;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function diagnostic(
  code: string,
  path: string,
  message: string,
): PluginThemeDiagnostic {
  return { code, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
