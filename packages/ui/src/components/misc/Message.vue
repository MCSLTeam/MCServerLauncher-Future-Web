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
import Button from "../button/Button.vue";

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
      ...(shadow ? [`mcsl-message__shadowed`] : []),
    ]"
    :style="{
      '--mcsl-message__title-color': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : getColorVar(color),
      '--mcsl-message__text-color': isSurface
        ? 'var(--mcsl-text-color-regular)'
        : getColorVar(color),
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
      '--mcsl-message__spacing': variant == 'text' ? '0' : undefined,
    }"
    class="mcsl-message"
  >
    <slot name="contextmenu" />
    <div class="mcsl-message__content">
      <i v-if="actualIcon" :class="actualIcon" />
      <div>
        <h4 v-if="title" class="mcsl-message__title">{{ title }}</h4>
        <slot :close="close" :open="open" />
        <div v-if="$slots.buttons" class="mcsl-message__buttons">
          <slot :close="close" :open="open" name="buttons" />
        </div>
      </div>
      <div class="mcsl-message__close-btn">
        <slot name="close-btn" :close="close">
          <Button
            v-if="closeable"
            :color="color"
            icon="fa fa-xmark"
            rounded
            type="text"
            @click="close"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "../Content" as *;

$btn-size: calc(var(--mcsl-message__icon-font-size) * 1.2);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-message {
    $original-spacing: utils.get-size-var("spacing", $size, $vars);
    --mcsl-message__spacing: #{$original-spacing};
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    & > .mcsl-message__content {
      $spacing: var(--mcsl-message__spacing);
      gap: $original-spacing;
      padding: $spacing;
      width: calc(100% - 2 * $spacing);

      & .mcsl-message__title {
        margin-bottom: calc($spacing / 2);
      }

      & > .mcsl-message__close-btn {
        top: $spacing;
        right: $spacing;
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
  grid-template-columns: $btn-size minmax(0, 1fr) auto;

  .mcsl-message__with-title & {
    --mcsl-message__icon-font-size: var(--mcsl-font-size-md);
  }

  --mcsl-message__icon-font-size: var(--mcsl-font-size-md);
  align-items: start;

  & > i {
    width: $btn-size;
    height: $btn-size;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1px;
    border-radius: var(--mcsl-border-radius-xs);
    background: color-mix(in srgb, var(--mcsl-message__accent-color) 11%, transparent);
    color: var(--mcsl-message__title-color);
  }

  & > div:not(.mcsl-message__close-btn) {
    min-width: 0;
  }

  & .mcsl-message__buttons {
    display: flex;
    justify-content: flex-end;
  }
}

.mcsl-message__close-btn {
  display: flex;
  align-items: flex-start;
  min-width: $btn-size;
}

.mcsl-message__variant-text {
  & .mcsl-message__title {
    color: var(--mcsl-message__title-color);
  }

  & * {
    color: var(--mcsl-message__text-color);
  }
}

.mcsl-message__variant-outlined {
  @extend .mcsl-message__variant-text;
  border: 1px solid var(--mcsl-message__border-color);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 88%, transparent);

  &.mcsl-message__shadowed {
    box-shadow: var(--mcsl-box-shadow-light);
  }
}

.mcsl-message__variant-default {
  @extend .mcsl-message__variant-outlined;
  background: color-mix(
    in srgb,
    var(--mcsl-message__bg-color),
    var(--mcsl-bg-color-overlay) 92%
  );
}

.mcsl-message__variant-soft {
  @extend .mcsl-message__variant-default;

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    background: var(--mcsl-message__accent-color);
    content: "";
  }
}
</style>

<style lang="scss">
$btn-size: calc(var(--mcsl-message__icon-font-size) * 1.2);

.mcsl-message__close-btn > .mcsl-button {
  min-width: 0 !important;
  width: $btn-size !important;
  height: $btn-size !important;
  padding: 0 !important;

  & > i {
    font-size: var(--mcsl-font-size-sm);
  }

  &:not(:hover):not(:active) {
    background: transparent !important;
  }
}
</style>
