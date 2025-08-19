<script setup lang="ts">
import type { Size } from "../../../utils/types.ts";
import { type Color, getColorVar } from "../../../utils/css.ts";
import { getSize } from "../../../utils/internal.ts";
import { withCtx } from "vue";

const props = withDefaults(
  defineProps<{
    color?: Color | "default";
    rounded?: boolean;
    icon?: string;
    size?: Size;
  }>(),
  {
    color: "default",
    rounded: false,
  },
);

const size: Size = withCtx(() => getSize(props.size))();
</script>

<template>
  <div
    class="mcsl-tag"
    :class="[
      `mcsl-size-${size}`,
      ...(rounded ? ['mcsl-tag__rounded'] : []),
      ...(color != 'default' ? [`mcsl-tag__colored`] : []),
    ]"
    :style="{
      '--mcsl-tag__color': color != 'default' ? getColorVar(color) : '',
    }"
  >
    <i v-if="icon" :class="icon" />
    <p>
      <slot />
    </p>
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-tag {
    $spacing: utils.get-size-var("spacing", $size, $vars);
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    padding: calc($spacing / 2) $spacing;
    gap: $spacing;

    & * {
      font-size: utils.get-size-var("font-size", $size, $vars);
    }
  }
}

.mcsl-tag {
  width: fit-content;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: var(--mcsl-bg-color-dark);

  &.mcsl-tag__colored {
    background: utils.transparent(var(--mcsl-tag__color), 15%);

    & * {
      color: var(--mcsl-tag__color);
    }
  }
}
</style>
