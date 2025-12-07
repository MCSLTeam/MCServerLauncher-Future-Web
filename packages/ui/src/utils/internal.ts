import {
  computed,
  type ComputedRef,
  type Ref,
  ref,
  type VueElement,
  watch,
} from "vue";
import type { ColorType } from "./css.ts";

// Context menu
export const currContextmenu = ref<VueElement>();

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    currContextmenu.value = undefined;
  }
});

// Meter group
export const colorMap = new Map<string, ColorType>();

export function animatedVisibilityExists(
  visible: Ref<boolean>,
  animationDuration:
    | number
    | {
        in: number;
        out: number;
      },
  hooks?: {
    beforeShow?: () => void;
    afterShow?: () => void;
    beforeHide?: () => void;
    afterHide?: () => void;
  },
): {
  exist: Ref<boolean>;
  status: ComputedRef<"in" | "out" | "show" | "hide">;
} {
  const exist = ref(visible.value);
  const status = ref<"in" | "out" | "show" | "hide">(visible ? "show" : "hide");

  const duration =
    typeof animationDuration === "number"
      ? {
          in: animationDuration,
          out: animationDuration,
        }
      : animationDuration;

  let timeout: number = -1;
  watch(visible, (value) => {
    clearTimeout(timeout);
    if (value) {
      // open
      exist.value = true;
      status.value = "in";
      hooks?.beforeShow?.();
      if (hooks?.afterShow) {
        timeout = window.setTimeout(() => {
          status.value = "show";
          hooks?.afterShow?.();
        }, duration.in);
      }
    } else {
      // close
      status.value = "out";
      hooks?.beforeHide?.();
      timeout = window.setTimeout(() => {
        exist.value = false;
        status.value = "hide";
        hooks?.afterHide?.();
      }, duration.out);
    }
  });
  return { exist, status: computed(() => status.value) };
}
