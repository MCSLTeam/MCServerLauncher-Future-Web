<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ColorData, type ColorType, getShadow } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    icon?: string;
    iconPos?: "left" | "right";
    loading?: boolean;
    loadingIcon?: string;
    loadingIconPos?: "left" | "right" | "same";
    align?: "left" | "right" | "center";
    link?: string;
    linkTarget?: string;
    routerLink?: boolean;
    color?: ColorType;
    type?: "default" | "primary" | "dashed" | "text";
    size?: Size;
    rounded?: boolean;
    squared?: boolean;
    block?: boolean;
    shadow?: "always" | "hover" | "never";
    btnType?: "submit" | "reset" | "button";
  }>(),
  {
    size: "medium",
    disabled: false,
    icon: "",
    iconPos: "left",
    loading: false,
    loadingIcon: "fas fa-circle-notch fa-spin",
    loadingIconPos: "same",
    align: "center",
    link: "",
    linkTarget: "_blank",
    routerLink: true,
    color: "surface",
    type: "default",
    rounded: false,
    squared: false,
    block: false,
    shadow: "never",
    btnType: "button",
  },
);

const emit = defineEmits<(e: "click", event: MouseEvent) => void>();

const icon = computed(() => (props.loading ? props.loadingIcon : props.icon));
const iconPos = computed(() =>
  props.loading && props.loadingIconPos != "same"
    ? props.loadingIconPos
    : props.iconPos,
);
const isSurface = computed(() => props.color == "surface");

const onClick = computed(() =>
  props.link
    ? (event: MouseEvent) => {
        emit("click", event);
        if (props.routerLink) {
          useRouter().push(props.link!);
        } else {
          window.open(
            props.link!,
            props.linkTarget,
            "noopener norefferrer nofollow ugc",
          );
        }
      }
    : (event: MouseEvent) => emit("click", event),
);
</script>

<template>
  <button
    :class="{
      [`mcsl-size-${size}`]: true,
      [`mcsl-button__shadow-${shadow}`]: true,
      [`mcsl-button__type-${type}`]: true,
      [`mcsl-button__align-${align}`]: true,
      'mcsl-button__rounded': rounded,
      'mcsl-button__squared': squared,
      'mcsl-button__block': block,
    }"
    :disabled="disabled || loading"
    :style="{
      // Shadow
      '--mcsl-button__box-shadow': isSurface
        ? '0 1px 2px color-mix(in srgb, var(--mcsl-text-color-primary) 5%, transparent)'
        : getShadow(props.color, 'light'),
      // Text
      '--mcsl-button__text-color': isSurface
        ? 'var(--mcsl-text-color-regular)'
        : `var(--mcsl-color-${color})`,
      '--mcsl-button__text-color-hover': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : `var(--mcsl-color-${color}-dark)`,
      '--mcsl-button__text-color-active': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : `var(--mcsl-color-${color}-darker)`,
      '--mcsl-button__text-color-disabled': isSurface
        ? 'var(--mcsl-text-color-secondary)'
        : `var(--mcsl-color-${color}-light)`,
      // Bg
      '--mcsl-button__bg': 'color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent)',
      '--mcsl-button__bg-hover': isSurface
        ? 'color-mix(in srgb, var(--mcsl-bg-color-dark) 72%, var(--mcsl-bg-color-overlay))'
        : new ColorData(props.color, 'default', 0.09).getCss(),
      '--mcsl-button__bg-active': isSurface
        ? 'color-mix(in srgb, var(--mcsl-bg-color-darker) 64%, var(--mcsl-bg-color-overlay))'
        : new ColorData(props.color, 'default', 0.15).getCss(),
      '--mcsl-button__bg-disabled': 'color-mix(in srgb, var(--mcsl-bg-color-dark) 78%, transparent)',
      // Border
      '--mcsl-button__border': isSurface
        ? 'color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent)'
        : new ColorData(props.color, 'default', 0.36).getCss(),
      '--mcsl-button__border-hover': isSurface
        ? 'color-mix(in srgb, var(--mcsl-border-color-dark) 68%, var(--mcsl-border-color-base))'
        : new ColorData(props.color, 'default', 0.62).getCss(),
      '--mcsl-button__border-active': isSurface
        ? 'color-mix(in srgb, var(--mcsl-border-color-dark) 72%, var(--mcsl-border-color-base))'
        : new ColorData(props.color, 'default', 0.68).getCss(),
      '--mcsl-button__border-disabled': isSurface
        ? 'var(--mcsl-border-color-light)'
        : 'var(--mcsl-border-color-base)',
      // Primary text
      '--mcsl-button__primary-text-color-light': isSurface
        ? 'var(--mcsl-text-color-opposite)'
        : 'var(--mcsl-text-color-opposite)',
      '--mcsl-button__primary-text-color-dark': isSurface
        ? 'var(--mcsl-text-color-opposite)'
        : 'var(--mcsl-text-color-regular)',
      // Primary bg
      '--mcsl-button__primary-bg': isSurface
        ? 'var(--mcsl-text-color-secondary)'
        : `var(--mcsl-color-${color})`,
      '--mcsl-button__primary-bg-hover': isSurface
        ? 'var(--mcsl-text-color-regular)'
        : `var(--mcsl-color-${color}-dark)`,
      '--mcsl-button__primary-bg-active': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : `var(--mcsl-color-${color}-darker)`,
      '--mcsl-button__primary-bg-disabled': 'color-mix(in srgb, var(--mcsl-border-color-dark) 70%, transparent)',
    }"
    class="mcsl-button"
    :type="btnType"
    @click="onClick"
  >
    <slot name="contextmenu" />
    <i
      v-if="icon != ''"
      :class="[...icon.split(' '), `mcsl-button__icon-${iconPos}`]"
      class="mcsl-button__icon"
    />
    <span v-if="$slots.default" class="mcsl-button__label"><slot /></span>
  </button>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "../Content" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-button {
    border-radius: var(--mcsl-border-radius-sm);

    $spacing: utils.get-size-var("spacing", $size, $vars);
    $size: utils.get-size-var("height", $size, $vars);
    padding: 0 calc($spacing * 1.6);
    min-width: $size;
    height: $size;
    gap: calc($spacing * 0.72);

    &.mcsl-button__squared {
      width: $size;
      padding: 0;
    }
  }
}

.mcsl-button {
  position: relative;
  box-sizing: border-box;
  border: 1px solid transparent;
  outline: none;
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mcsl-button__text-color);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color 0.14s ease-out,
    border-color 0.14s ease-out,
    color 0.14s ease-out,
    opacity 0.14s ease-out,
    box-shadow 0.14s ease-out;

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    transition: color 0.14s ease-out, opacity 0.14s ease-out;
  }

  &:active {
    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      transition-duration: 0.1s;
    }

    transition-duration: 0.1s;
  }

  &:disabled {
    cursor: not-allowed;
    box-shadow: none !important;
  }

  &.mcsl-button__block {
    width: 100%;
  }

  &.mcsl-button__align-left {
    justify-content: flex-start;
  }

  &.mcsl-button__align-center {
    justify-content: center;
  }

  &.mcsl-button__align-right {
    justify-content: flex-end;
  }

  &.mcsl-button__rounded {
    border-radius: var(--mcsl-border-radius-full);
  }

  &.mcsl-button__shadow-always {
    box-shadow: var(--mcsl-button__box-shadow);
  }

  &.mcsl-button__shadow-always:hover,
  &.mcsl-button__shadow-hover:hover {
    box-shadow: var(--mcsl-button__box-shadow);
  }

  &.mcsl-button__with-text {
    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      margin: 0.25rem;
    }
  }

  & > .mcsl-button__icon {
    &.mcsl-button__icon-left {
      order: 0;
    }

    &.mcsl-button__icon-right {
      order: 2;
    }
  }
}

.mcsl-button__type-text {
  background: transparent;
  border-color: transparent;

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    color: var(--mcsl-button__text-color);
  }

  &:hover {
    border-color: transparent;

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-hover);
    }

    background: var(--mcsl-button__bg-hover);
  }

  &:active {
    border-color: transparent;

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-active);
    }

    background: var(--mcsl-button__bg-active);
  }

  &:disabled {
    border-color: transparent;

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-disabled);
    }

    background: transparent;
  }

  &:focus-visible {
    box-shadow:
      var(--mcsl-button__focus-shadow, 0 0 0 3px color-mix(in srgb, var(--mcsl-color-help) 18%, transparent)),
      var(--mcsl-button__type-shadow, 0 0 0 0 transparent);
  }
}

.mcsl-button__type-text,
.mcsl-button__type-default {
  --mcsl-button__border-type: solid;
}

.mcsl-button__type-dashed {
  --mcsl-button__border-type: dashed;
}

.mcsl-button__type-default,
.mcsl-button__type-dashed {
  background: var(--mcsl-button__bg);

  border: 1px var(--mcsl-button__border-type) var(--mcsl-button__border);

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    color: var(--mcsl-button__text-color);
  }

  &:hover {
    border-color: var(--mcsl-button__border-hover);
    background: var(--mcsl-button__bg-hover);

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-hover);
    }
  }

  &:active {
    border-color: var(--mcsl-button__border-hover);
    background: var(--mcsl-button__bg-active);

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-active);
    }
  }

  &:disabled {
    border-color: var(--mcsl-button__border-disabled);
    background: var(--mcsl-button__bg-disabled);

    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-disabled);
    }
  }

  &:focus-visible {
    box-shadow:
      var(--mcsl-button__focus-shadow, 0 0 0 3px color-mix(in srgb, var(--mcsl-color-help) 18%, transparent)),
      var(--mcsl-button__type-shadow, 0 0 0 0 transparent);
  }
}

.mcsl-button__type-primary {
  border: 1px solid var(--mcsl-button__primary-bg);
  background: var(--mcsl-button__primary-bg);
  --mcsl-button__type-shadow: 0 1px 2px color-mix(in srgb, var(--mcsl-button__primary-bg) 18%, transparent);

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    .light & {
      color: var(--mcsl-button__primary-text-color-light);
    }

    .dark & {
      color: var(--mcsl-button__primary-text-color-dark);
    }
  }

  &:hover {
    border-color: var(--mcsl-button__primary-bg-hover);
    background: var(--mcsl-button__primary-bg-hover);
  }

  &:active {
    border-color: var(--mcsl-button__primary-bg-hover);
    background: var(--mcsl-button__primary-bg-active);
  }

  &:disabled {
    border-color: var(--mcsl-button__primary-bg-disabled);
    background: var(--mcsl-button__primary-bg-disabled);
  }

  &:focus-visible {
    box-shadow:
      var(--mcsl-button__focus-shadow, 0 0 0 3px color-mix(in srgb, var(--mcsl-color-help) 18%, transparent)),
      var(--mcsl-button__type-shadow, 0 0 0 0 transparent);
  }
}
</style>
