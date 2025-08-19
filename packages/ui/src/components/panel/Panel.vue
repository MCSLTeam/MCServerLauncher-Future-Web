<script setup lang="ts">
import { computed, useSlots, withCtx } from "vue";
import type { Size } from "../../utils/types.ts";
import { getSize } from "../../utils/internal.ts";
import Divider from "../misc/Divider.vue";

const props = withDefaults(
  defineProps<{
    header?: string;
    headerDivider?: boolean;
    shadow?: "always" | "hover" | "never";
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
  }>(),
  {
    headerDivider: true,
    shadow: "never",
    headerClass: "",
    headerStyle: "",
    bodyClass: "",
    bodyStyle: "",
  },
);

const size: Size = withCtx(() => getSize(props.size))();

const hasHeader = computed(
  () =>
    props.header ||
    (useSlots().header && (useSlots().header!()[0]?.children?.length ?? 0 > 0)),
);
</script>

<template>
  <div
    class="mcsl-panel"
    :class="[
      `mcsl-size-${size}`,
      ...(shadow !== 'never' ? [`mcsl-panel__shadow-${shadow}`] : []),
      ...(!headerDivider ? ['mcsl-panel__no-divider'] : []),
    ]"
  >
    <slot name="contextmenu" />
    <div
      v-if="hasHeader"
      class="mcsl-panel__header"
      :class="headerClass"
      :style="headerStyle"
    >
      <slot name="header">
        <h2>{{ header }}</h2>
      </slot>
    </div>
    <div class="mcsl-panel__body-wrapper">
      <Divider v-if="hasHeader && headerDivider" />
      <div class="mcsl-panel__body" :class="bodyClass" :style="bodyStyle">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "Panel" as *;
@use "../../assets/css/utils";

.mcsl-panel {
  margin: 5px;
  overflow: auto;
  background: var(--mcsl-bg-color-overlay);
  border: 1px solid var(--mcsl-border-color-base);
  transition: 0.2s ease-in-out;
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-panel {
    $spacing: utils.get-size-var("spacing", $size, $vars);

    border-radius: utils.get-size-var("border-radius", $size, $vars);
    padding: $spacing;

    &.mcsl-panel__shadow-always,
    .mcsl-panel__shadow-hover:hover {
      box-shadow: utils.get-size-var("box-shadow", $size, $vars);
    }

    & > .mcsl-panel__body-wrapper > .mcsl-divider {
      padding: calc($spacing / 2) 0;
    }

    &.mcsl-panel__no-divider > .mcsl-panel__body-wrapper > .mcsl-panel__body {
      padding-top: $spacing;
    }
  }
}

.mcsl-panel__header {
  & * {
    color: var(--mcsl-text-color-primary);
  }
}
</style>
