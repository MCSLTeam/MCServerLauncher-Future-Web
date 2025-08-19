const COLOR_TYPES: string[] = [
  "primary",
  "success",
  "warning",
  "danger",
  "help",
  "surface",
  "emerald",
  "green",
  "lime",
  "orange",
  "amber",
  "yellow",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "soho",
  "viva",
  "ocean",
];

export type ColorType =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "help"
  | "surface"
  | "emerald"
  | "green"
  | "lime"
  | "orange"
  | "amber"
  | "yellow"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "soho"
  | "viva"
  | "ocean";

export type ColorStep =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950
  | "default"
  | "dark"
  | "darker"
  | "light"
  | "lighter";

export type ColorVar =
  | "bg-color-main"
  | "bg-color-overlay"
  | "bg-color-overlay-opposite"
  | "border-color-light"
  | "border-color-base"
  | "border-color-dark"
  | "text-color-primary"
  | "text-color-regular"
  | "text-color-secondary"
  | "text-color-gray"
  | "text-color-opposite";

export class ColorData {
  readonly type: ColorType;
  readonly step: ColorStep;
  readonly opacity: number;

  constructor(
    type: ColorType,
    step: ColorStep = "default",
    opacity: number = 1,
  ) {
    this.type = type;
    this.step = step;
    this.opacity = opacity;
  }

  getCss(darkerSurface = true): string {
    const cssVar =
      this.type == "surface" && this.step == "default" && darkerSurface
        ? getColorVar("bg-color-overlay-opposite")
        : this.step == "default"
          ? `var(--mcsl-color-${this.type})`
          : `var(--mcsl-color-${this.type}-${this.step})`;
    if (this.opacity == 1) return cssVar;
    return `color-mix(in srgb, transparent, ${cssVar} ${this.opacity * 100}%)`;
  }

  getShadow(type: "lighter" | "light" | "base" | "dark" | "darker") {
    return `var(--mcsl-color-${this.type}-shadow-${type})`;
  }
}

export type Color = ColorData | ColorType | ColorVar;

export function getColorVar(color: Color, darkerSurface = true) {
  if (color instanceof ColorData) return color.getCss(darkerSurface);
  else if (color == "surface" && darkerSurface)
    return getColorVar("bg-color-overlay-opposite");
  else if (COLOR_TYPES.includes(color))
    return getColorVar(new ColorData(color as ColorType));
  return `var(--mcsl-${color})`;
}

export function getStatusIcon(
  status: "success" | "warn" | "danger" | "error" | string,
  circled = true,
) {
  switch (status) {
    case "success":
      return circled ? "fas fa-circle-check" : "fas fa-check";
    case "warning":
      return circled ? "fas fa-triangle-exclamation" : "fas fa-exclamation";
    case "danger":
    case "error":
      return circled ? "fas fa-circle-xmark" : "fas fa-xmark";
    default:
      return undefined;
  }
}
