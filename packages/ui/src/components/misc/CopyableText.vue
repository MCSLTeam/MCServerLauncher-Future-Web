<script lang="ts" setup>
import type { Size } from "../../utils/utils.ts";
import { onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

withDefaults(
  defineProps<{
    size?: Size;
  }>(),
  {
    size: "medium",
  },
);

const t = useI18n().t;
const textEl = ref();
const icon = ref("far fa-clipboard");

let timeout = -1;

function copy() {
  clearTimeout(timeout);
  const text = textEl.value.innerText;
  navigator.clipboard.writeText(text);
  icon.value = "fa fa-check";
  timeout = window.setTimeout(() => {
    icon.value = "far fa-clipboard";
  }, 2000);
}

onUnmounted(() => {
  clearTimeout(timeout);
});
</script>

<template>
  <div
    :class="{
      [`mcsl-size-${size}`]: true,
    }"
    class="mcsl-copyable-text"
    v-tooltip="t('ui.copyable-text.tooltip')"
    @click="copy"
  >
    <p ref="textEl">
      <slot />
    </p>
    <i :class="icon" />
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-copyable-text {
    $spacing: utils.get-size-var("spacing", $size, $vars);
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    padding: calc($spacing / 2) $spacing;
  }
}

.mcsl-copyable-text {
  width: fit-content;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: var(--mcsl-bg-color-dark);
  gap: var(--mcsl-spacing-4xs);
  cursor: pointer;
  transition: 0.2s ease-in-out;

  &:hover {
    background: var(--mcsl-bg-color-darker);
  }
}
</style>
