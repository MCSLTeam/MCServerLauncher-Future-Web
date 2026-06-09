<script setup lang="ts">
import type { Size } from "../../utils/utils";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    size?: Size;
    shadow?: "always" | "hover" | "never";
  }>(),
  {
    title: "",
    description: "",
    size: "medium",
    shadow: "never",
  },
);
</script>

<template>
  <div class="mcsl-card" :class="[`mcsl-size-${size}`, `mcsl-card__shadow-${shadow}`]">
    <div v-if="title || $slots.header" class="mcsl-card__header">
      <slot name="header">
        <div>
          <h3 v-if="title">{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>
      </slot>
    </div>
    <div class="mcsl-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";
@use "../Content" as *;

.mcsl-card {
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  transition: var(--mcsl-motion-duration-base) var(--mcsl-motion-ease-standard);
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-card {
    $spacing: utils.get-size-var("spacing", $size, $vars);
    padding: calc($spacing + var(--mcsl-spacing-4xs));
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    &.mcsl-card__shadow-always,
    &.mcsl-card__shadow-hover:hover {
      box-shadow: var(--mcsl-box-shadow-base);
    }
  }
}

.mcsl-card__header {
  margin-bottom: var(--mcsl-spacing-sm);

  h3 {
    margin: 0;
    color: var(--mcsl-text-color-primary);
    font-size: var(--mcsl-font-size-xl);
    font-weight: 600;
  }

  p {
    margin: var(--mcsl-spacing-4xs) 0 0;
    color: var(--mcsl-text-color-secondary);
    line-height: 1.6;
  }
}
</style>
