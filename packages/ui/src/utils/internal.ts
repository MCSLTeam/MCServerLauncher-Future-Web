import {
  inject,
  provide,
  readonly,
  type Ref,
  ref,
  type VueElement,
  watch,
} from "vue";
import type { ColorType } from "./css.ts";
import type { Size } from "./types.ts";

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
  status: Readonly<Ref<"in" | "out" | "show" | "hide">>;
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
  return { exist, status: readonly(status) };
}

export function getSize(sizeProp: Size | undefined) {
  let size = inject("mcsl-size", "middle") as Size;
  if (sizeProp) {
    switch (sizeProp) {
      case "smaller":
        switch (size) {
          case "large":
            size = "middle";
            break;
          case "middle":
            size = "small";
            break;
        }
        break;
      case "larger":
        switch (size) {
          case "small":
            size = "middle";
            break;
          case "middle":
            size = "large";
            break;
        }
        break;
      default:
        size = sizeProp;
    }
  }
  provide("mcsl-size", size);
  return size;
}
