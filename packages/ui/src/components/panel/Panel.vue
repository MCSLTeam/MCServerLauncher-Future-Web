<script lang="ts" setup>
import { onMounted, ref } from "vue";
import type { Size } from "../../utils/utils.ts";
import Divider from "../misc/Divider.vue";

withDefaults(
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
    border?: boolean;
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
    border: false,
  },
);

const hasHeader = ref(true);
const headerRef = ref();

onMounted(() => {
  hasHeader.value = headerRef.value.innerText.trim() !== "";
});
</script>

<template>
  <div
    :class="{
      [`mcsl-size-${size}`]: true,
      [`mcsl-panel__shadow-${shadow}`]: shadow !== 'never',
      'mcsl-panel__need-divider': !headerDivider && hasHeader,
      'mcsl-panel__not-scrollable': !scrollable,
      'mcsl-panel__border': border,
    }"
    class="mcsl-panel"
  >
    <slot name="contextmenu" />
    <div
      ref="headerRef"
      v-if="hasHeader"
      :class="headerClass"
      :style="headerStyle"
      class="mcsl-panel__header"
    >
      <slot name="header">
        <h2>{{ header }}</h2>
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
      padding: calc($spacing / 2) 0;
    }

    &.mcsl-panel__need-divider > .mcsl-panel__body-wrapper > .mcsl-panel__body {
      padding-top: $spacing;
    }
  }
}

.mcsl-panel__border {
  border: 1px solid var(--mcsl-border-color-base);
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
