import { loadUi } from "@repo/ui/src";
import type { Composer } from "vue-i18n";

export function load(i18n: Composer) {
  loadUi(i18n);
}
