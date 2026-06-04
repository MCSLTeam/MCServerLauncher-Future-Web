<script setup lang="ts">
import DropdownContent from "./DropdownContent.vue";

withDefaults(
  defineProps<{
    content?: string;
    defaultPos?: "top" | "bottom" | "left" | "right";
  }>(),
  {
    content: "",
    defaultPos: "top",
  },
);
</script>

<template>
  <DropdownContent :default-pos="defaultPos">
    <template #triggerer="slotProps">
      <slot name="triggerer" v-bind="slotProps" />
    </template>
    <div class="mcsl-tooltip">
      <slot>{{ content }}</slot>
    </div>
  </DropdownContent>
</template>

<style scoped lang="scss">
.mcsl-tooltip {
  max-width: 20rem;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
  box-shadow: var(--mcsl-box-shadow-base);
  color: var(--mcsl-text-color-primary);
  font-size: var(--mcsl-font-size-sm);
  line-height: 1.5;
}
</style>
