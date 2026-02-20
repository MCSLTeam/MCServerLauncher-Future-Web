<script lang="ts" setup>
import { computed } from "vue";
import type { Size } from "../../utils/utils.ts";
import { animatedVisibilityExists } from "../../utils/internal.ts";
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
  variant?: "text" | "outlined" | "default";
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
  variant: "default",
  inAnim: "0.2s ease-in-out both stretchInDown",
  outAnim: "0.2s ease-in-out both stretchOutUp",
  shadow: false,
  closeable: false,
});

const actualIcon = computed(() => props.icon ?? getStatusIcon(props.color));

const visible = defineModel<boolean>("visible", {
  default: true,
});

const { exist } = animatedVisibilityExists(visible, 500);

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
      <Button
        v-if="closeable"
        :color="color"
        class="mcsl-message__close-btn"
        icon="fa fa-xmark"
        rounded
        type="text"
        @click="close"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "../Content" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-message {
    --mcsl-message__spacing: #{utils.get-size-var("spacing", $size, $vars)};
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    & > .mcsl-message__content {
      $spacing: var(--mcsl-message__spacing);
      gap: $spacing;
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
  display: flex;

  .mcsl-message__with-title & {
    --mcsl-message__icon-font-size: var(--mcsl-font-size-lg);
  }

  --mcsl-message__icon-font-size: var(--mcsl-font-size-md);
  $size: calc(var(--mcsl-message__icon-font-size) * 1.2);

  & > i {
    width: $size;
    height: $size;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  & > div {
    width: calc(100% - $size - var(--mcsl-message__spacing));
  }

  & > .mcsl-message__close-btn {
    position: absolute;
    min-width: 0;
    width: $size;
    height: $size;
    padding: 0;

    &:not(:hover):not(:active) {
      background: transparent;
    }
  }

  & .mcsl-message__buttons {
    display: flex;
    justify-content: flex-end;
  }
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

  &.mcsl-message__shadowed {
    box-shadow: var(--mcsl-message__box-shadow);
  }
}

.mcsl-message__variant-default {
  @extend .mcsl-message__variant-outlined;
  background: color-mix(
    in srgb,
    var(--mcsl-message__bg-color),
    transparent 90%
  );
  backdrop-filter: blur(5px);
}
</style>
