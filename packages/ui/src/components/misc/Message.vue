<script lang="ts" setup>
import { computed } from "vue";
import type { Size } from "../../utils/utils.ts";
import { animatedVisibilityExists } from "../../utils/utils.ts";
import {
  ColorData,
  type ColorType,
  getColorVar,
  getShadow,
  getStatusIcon,
} from "../../utils/css.ts";

export type MessageProps = {
  color?: ColorType;
  variant?: "text" | "outlined" | "default" | "soft";
  icon?: string;
  inAnim?: string;
  outAnim?: string;
  closeable?: boolean;
  title?: string;
  shadow?: boolean;
  size?: Size;
};

const props = withDefaults(defineProps<MessageProps>(), {
  size: "medium",
  color: "primary",
  variant: "soft",
  inAnim: "0.14s ease-out both fadeInUp",
  outAnim: "0.14s ease-out both fadeOut",
  shadow: false,
  closeable: false,
});

const emit = defineEmits<(e: "open" | "opened" | "close" | "closed") => void>();

const actualIcon = computed(() => props.icon ?? getStatusIcon(props.color));

const visible = defineModel<boolean>("visible", {
  default: true,
});

const { exist } = animatedVisibilityExists(visible, 500, {
  beforeShow() {
    emit("open");
  },
  afterShow() {
    emit("opened");
  },
  beforeHide() {
    emit("close");
  },
  afterHide() {
    emit("closed");
  },
});

const isSurface = computed(() => props.color == "surface");

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

defineExpose({
  open,
  close,
});
</script>

<template>
  <div
    v-if="exist"
    :class="[
      `mcsl-size-${size}`,
      `mcsl-message__variant-${variant}`,
      ...(visible ? [`mcsl-message__visible`] : []),
      ...(title ? [`mcsl-message__with-title`] : []),
      ...(actualIcon ? [`mcsl-message__show-icon`] : []),
      ...(closeable || $slots['close-btn'] ? [`mcsl-message__closable`] : []),
      ...(shadow ? [`mcsl-message__shadowed`] : []),
    ]"
    :style="{
      '--mcsl-message__title-color': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : 'var(--mcsl-text-color-primary)',
      '--mcsl-message__text-color': isSurface
        ? 'var(--mcsl-text-color-regular)'
        : 'var(--mcsl-text-color-regular)',
      '--mcsl-message__bg-color': getColorVar(color),
      '--mcsl-message__border-color': isSurface
        ? 'var(--mcsl-border-color-base)'
        : new ColorData(color, 'light').getCss(),
      '--mcsl-message__accent-color': isSurface
        ? 'var(--mcsl-text-color-secondary)'
        : getColorVar(color),
      '--mcsl-message__box-shadow': isSurface
        ? 'var(--mcsl-box-shadow-base)'
        : getShadow(color, 'base'),
      '--mcsl-message__anim-in': inAnim + ' 0.2s',
      '--mcsl-message__anim-out': outAnim,
      '--mcsl-message__spacing':
        variant == 'text' ? 'var(--mcsl-spacing-2xs)' : undefined,
    }"
    class="mcsl-message"
  >
    <slot name="contextmenu" />
    <div class="mcsl-message__content">
      <i v-if="actualIcon" :class="actualIcon" class="mcsl-message__icon" />
      <div class="mcsl-message__body">
        <h4 v-if="title" class="mcsl-message__title">{{ title }}</h4>
        <div class="mcsl-message__text">
          <slot :close="close" :open="open" />
        </div>
        <div v-if="$slots.buttons" class="mcsl-message__buttons">
          <slot :close="close" :open="open" name="buttons" />
        </div>
      </div>
      <div class="mcsl-message__close-btn">
        <slot name="close-btn" :close="close">
          <button
            v-if="closeable"
            aria-label="Close message"
            class="mcsl-message__close"
            type="button"
            @click="close"
          >
            <i class="fa fa-xmark" />
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "../Content" as *;

$btn-size: calc(var(--mcsl-message__icon-font-size) * 1.2);
$close-size: 20px;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-message {
    $original-spacing: utils.get-size-var("spacing", $size, $vars);
    --mcsl-message__spacing: #{$original-spacing};
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    & > .mcsl-message__content {
      $spacing: var(--mcsl-message__spacing);
      padding: $spacing;
      box-sizing: border-box;
      width: 100%;

      & .mcsl-message__title {
        margin-bottom: 9px;
      }

      & .mcsl-message__buttons {
        gap: $spacing;
      }
    }
  }
}

.mcsl-message {
  width: 100%;
  transform: translate(0);
  position: relative;
  overflow: hidden;
  text-align: start;
  word-break: break-word;
  line-height: 1.6;
  background: var(--mcsl-message__surface-color);
  transition:
    background-color 0.22s ease-out,
    border-color 0.22s ease-out,
    box-shadow 0.22s ease-out;
  animation:
    var(--mcsl-message__anim-out),
    1s 0.2s cubic-bezier(0, 1, 0, 1) collapseOutVertical;

  &.mcsl-message__visible {
    animation:
      0.8s ease-in-out collapseInVertical,
      var(--mcsl-message__anim-in);
  }
}

.mcsl-message__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  align-items: start;

  .mcsl-message__with-title & {
    --mcsl-message__icon-font-size: 24px;
  }

  --mcsl-message__icon-font-size: 20px;
}

.mcsl-message__show-icon .mcsl-message__content {
  grid-template-columns: $btn-size minmax(0, 1fr);
}

.mcsl-message__closable .mcsl-message__content {
  grid-template-columns: minmax(0, 1fr) $close-size;
}

.mcsl-message__show-icon.mcsl-message__closable .mcsl-message__content {
  grid-template-columns: $btn-size minmax(0, 1fr) $close-size;
}

.mcsl-message__icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: $btn-size;
  height: $btn-size;
  color: var(--mcsl-message__accent-color);
  font-size: var(--mcsl-message__icon-font-size);
  transition: color 0.22s ease-out;
}

.mcsl-message__body {
  min-width: 0;
  grid-column: 1;
}

.mcsl-message__show-icon .mcsl-message__body {
  grid-column: 2;
}

.mcsl-message__title {
  margin: 0;
  color: var(--mcsl-message__title-color);
  font-size: var(--mcsl-font-size-md);
  font-weight: 650;
  line-height: 1.22;
  transition: color 0.22s ease-out;
}

.mcsl-message__text {
  color: var(--mcsl-message__text-color);
  font-size: var(--mcsl-font-size-sm);
  transition: color 0.22s ease-out;
}

.mcsl-message__buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--mcsl-spacing-xs);
}

.mcsl-message__close-btn {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  min-width: $close-size;
  grid-column: 2;
}

.mcsl-message__show-icon.mcsl-message__closable .mcsl-message__close-btn {
  grid-column: 3;
}

.mcsl-message__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: $close-size;
  height: $close-size;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--mcsl-border-radius-xs);
  background: transparent;
  color: var(--mcsl-text-color-secondary);
  cursor: pointer;
  outline: 0 solid transparent;
  transition:
    background-color 0.18s ease-out,
    color 0.18s ease-out,
    outline-color 0.18s ease-out;

  &:hover {
    background: color-mix(in srgb, var(--mcsl-message__accent-color) 12%, transparent);
    color: var(--mcsl-message__accent-color);
  }

  &:active {
    background: color-mix(in srgb, var(--mcsl-message__accent-color) 18%, transparent);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--mcsl-message__accent-color) 42%, transparent);
    outline-offset: 2px;
  }
}

.mcsl-message__variant-text {
  --mcsl-message__surface-color: transparent;
}

.mcsl-message__variant-outlined {
  --mcsl-message__surface-color: color-mix(in srgb, var(--mcsl-bg-color-overlay) 86%, transparent);
  border: 1px solid var(--mcsl-message__border-color);

  &.mcsl-message__shadowed {
    box-shadow: var(--mcsl-box-shadow-light);
  }
}

.mcsl-message__variant-default {
  --mcsl-message__surface-color: color-mix(
    in srgb,
    var(--mcsl-bg-color-overlay) 92%,
    var(--mcsl-message__bg-color) 8%
  );
  border: 1px solid var(--mcsl-message__border-color);
}

.mcsl-message__variant-soft {
  --mcsl-message__surface-color: color-mix(
    in srgb,
    var(--mcsl-bg-color-overlay) 92%,
    var(--mcsl-message__bg-color) 8%
  );
  border: 1px solid transparent;
}
</style>
