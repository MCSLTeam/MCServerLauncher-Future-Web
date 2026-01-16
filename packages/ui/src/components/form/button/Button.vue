<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ColorData, type ColorType, getShadow } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

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
    size: "middle",
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
        ? 'var(--mcsl-box-shadow-base)'
        : getShadow(props.color, 'base'),
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
        ? 'var(--mcsl-text-color-gray)'
        : `var(--mcsl-color-${color}-light)`,
      // Bg
      '--mcsl-button__bg': 'var(--mcsl-bg-color-overlay)',
      '--mcsl-button__bg-hover': isSurface
        ? 'var(--mcsl-bg-color-dark)'
        : new ColorData(props.color, 'default', 0.2).getCss(),
      '--mcsl-button__bg-active': isSurface
        ? 'var(--mcsl-bg-color-darker)'
        : new ColorData(props.color, 'default', 0.25).getCss(),
      '--mcsl-button__bg-disabled': 'var(--mcsl-bg-color-darker)',
      // Border
      '--mcsl-button__border': isSurface
        ? 'var(--mcsl-border-color-base)'
        : `var(--mcsl-color-${color}-lighter)`,
      '--mcsl-button__border-hover': isSurface
        ? 'var(--mcsl-border-color-base)'
        : `var(--mcsl-color-${color}-light)`,
      '--mcsl-button__border-active': isSurface
        ? 'var(--mcsl-border-color-dark)'
        : `var(--mcsl-color-${color})`,
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
        : `var(--mcsl-color-${color}-600)`,
      '--mcsl-button__primary-bg-active': isSurface
        ? 'var(--mcsl-text-color-primary)'
        : `var(--mcsl-color-${color}-700)`,
      '--mcsl-button__primary-bg-disabled': 'var(--mcsl-bg-color-darker)',
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
@use "../../../assets/css/utils";
@use "../../Content" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-button {
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    $spacing: utils.get-size-var("spacing", $size, $vars);
    $size: utils.get-size-var("height", $size, $vars);
    padding: $spacing;
    min-width: $size;
    height: $size;
    gap: calc($spacing / 2);

    &.mcsl-button__squared {
      width: $size;
    }
  }
}

.mcsl-button {
  border: none;
  outline: 0 solid transparent;
  outline-offset: 2px;
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s ease-in-out;

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    transition: 0.2s ease-in-out;
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
    box-shadow: var(--mcsl-box-shadow-base);
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
  background: var(--mcsl-button__bg);

  & > .mcsl-button__label,
  & > .mcsl-button__icon {
    color: var(--mcsl-button__text-color);
  }

  &:hover {
    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-hover);
    }

    background: var(--mcsl-button__bg-hover);
  }

  &:active {
    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-active);
    }

    background: var(--mcsl-button__bg-active);
  }

  &:disabled {
    & > .mcsl-button__label,
    & > .mcsl-button__icon {
      color: var(--mcsl-button__text-color-disabled);
    }

    background: var(--mcsl-button__bg-disabled);
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}

.mcsl-button__type-default {
  --mcsl-button__border-type: solid;
}

.mcsl-button__type-dashed {
  --mcsl-button__border-type: dashed;
}

.mcsl-button__type-default,
.mcsl-button__type-dashed {
  @extend .mcsl-button__type-text;
  border: 1px var(--mcsl-button__border-type) var(--mcsl-button__border);

  &:hover {
    border: 1px var(--mcsl-button__border-type) var(--mcsl-button__border-hover);
  }

  &:active {
    border: 1px var(--mcsl-button__border-type)
      var(--mcsl-button__border-active);
  }

  &:disabled {
    border: 1px var(--mcsl-button__border-type)
      var(--mcsl-button__border-disabled);
  }
}

.mcsl-button__type-primary {
  border: 1px solid var(--mcsl-button__primary-bg);
  background: var(--mcsl-button__primary-bg);

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
    border: 1px solid var(--mcsl-button__primary-bg-hover);
    background: var(--mcsl-button__primary-bg-hover);
  }

  &:active {
    border: 1px solid var(--mcsl-button__primary-bg-active);
    background: var(--mcsl-button__primary-bg-active);
  }

  &:disabled {
    border: 1px solid var(--mcsl-button__primary-bg-disabled);
    background: var(--mcsl-button__primary-bg-disabled);
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}
</style>
