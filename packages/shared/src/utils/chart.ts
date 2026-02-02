import { Chart, registerables } from "chart.js";
import {
  type ColorType,
  getCSSVar,
  transparent,
} from "@repo/ui/src/utils/css.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import zoomPlugin from "chartjs-plugin-zoom";

export function loadChart() {
  Chart.register(...registerables, zoomPlugin);

  Chart.defaults.color = getCSSVar("--mcsl-text-color-regular");
  Chart.defaults.borderColor = getCSSVar("--mcsl-border-color-base");
  Chart.defaults.hoverBorderColor = getCSSVar("--mcsl-border-color-dark");
  Chart.defaults.font.family = getCSSVar("--mcsl-font-family-sans");
  Chart.defaults.font.size = 12;
  Chart.defaults.interaction.intersect = false;

  Chart.defaults.plugins.zoom.zoom!.mode = "x";
  Chart.defaults.plugins.zoom.zoom!.wheel!.enabled = true;
  Chart.defaults.plugins.zoom.zoom!.pinch!.enabled = true;
  Chart.defaults.plugins.zoom.zoom!.drag!.enabled = true;

  Chart.defaults.plugins.tooltip.backgroundColor =
    getCSSVar("--mcsl-tooltip__bg");
  Chart.defaults.plugins.tooltip.titleColor =
    Chart.defaults.plugins.tooltip.bodyColor = getCSSVar(
      "--mcsl-text-color-light",
    );
  Chart.defaults.plugins.tooltip.cornerRadius = 7;

  Chart.defaults.locale = useLocale().locale;
}

export function chartDatasetColor(color: ColorType) {
  return {
    borderColor: getCSSVar(`--mcsl-color-${color}-chart-line`),
    backgroundColor: transparent(
      getCSSVar(`--mcsl-color-${color}-chart-line`),
      0.2,
    ),
    pointBackgroundColor: transparent(
      getCSSVar(`--mcsl-color-${color}-chart-line`),
      0.7,
    ),
    pointHoverBorderColor: getCSSVar(`--mcsl-color-${color}`),
    fill: true,
  };
}
