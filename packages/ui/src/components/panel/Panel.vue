<script lang="ts" setup>
import { onMounted, ref } from "vue";
import type { Size } from "../../utils/utils.ts";
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
    scrollable?: boolean;
  }>(),
  {
    size: "medium",
    headerDivider: true,
    shadow: "never",
    headerClass: "",
    headerStyle: "",
    bodyClass: "",
    bodyStyle: "",
    scrollable: false,
  },
);

const hasHeader = ref(true);
const headerEl = ref();
const textHeader = ref();

onMounted(() => {
  if (!props.header) textHeader.value?.remove?.();
  hasHeader.value = headerEl.value.innerHTML.trim() != "";
});
</script>

<template>
  <div
    :class="{
      [`mcsl-size-${size}`]: true,
      [`mcsl-panel__shadow-${shadow}`]: shadow !== 'never',
      'mcsl-panel__need-divider': !headerDivider && hasHeader,
      'mcsl-panel__not-scrollable': !scrollable,
    }"
    class="mcsl-panel"
  >
    <slot name="contextmenu" />
    <div
      ref="headerEl"
      v-if="hasHeader"
      :class="headerClass"
      :style="headerStyle"
      class="mcsl-panel__header"
    >
      <slot name="header">
        <h2 ref="textHeader">{{ header }}</h2>
      </slot>
    </div>
    <div class="mcsl-panel__body-wrapper">
      <Divider v-if="hasHeader && headerDivider" />
      <div :class="bodyClass" :style="bodyStyle" class="mcsl-panel__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "Panel" as *;
@use "../../assets/css/utils";

.mcsl-panel {
  overflow: auto;
  border: 1px solid var(--mcsl-border-color-base);
  background: var(--mcsl-bg-color-overlay);
  transition: box-shadow 0.2s ease-in-out;
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-panel {
    $spacing: utils.get-size-var("spacing", $size, $vars);

    border-radius: utils.get-size-var("border-radius", $size, $vars);
    padding: $spacing;

    &.mcsl-panel__shadow-always,
    &.mcsl-panel__shadow-hover:hover {
      box-shadow: utils.get-size-var("box-shadow", $size, $vars);
    }

    & > .mcsl-panel__body-wrapper > .mcsl-divider {
      padding: calc($spacing / 1.5) 0;
    }

    &.mcsl-panel__need-divider > .mcsl-panel__body-wrapper > .mcsl-panel__body {
      padding-top: $spacing;
    }
  }
}

.mcsl-panel__header {
  & * {
    color: var(--mcsl-text-color-primary);
  }
}

.mcsl-panel__not-scrollable {
  & > .mcsl-panel__body-wrapper,
  & .mcsl-panel__body {
    height: 100%;
  }
}
</style>
