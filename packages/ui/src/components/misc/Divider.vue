<script lang="ts" setup>
withDefaults(
  defineProps<{
    spacing?: "4xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
    variant?: "solid" | "dotted" | "dashed";
    type?: "horizontal" | "vertical";
    textPos?: "start" | "center" | "end";
    bgColor?: string;
  }>(),
  {
    spacing: "md",
    variant: "solid",
    type: "horizontal",
    textPos: "center",
    bgColor: "var(--mcsl-bg-color-overlay)",
  },
);
</script>

<template>
  <div
    :class="[
      'mcsl-divider__variant-' + variant,
      'mcsl-divider__type-' + type,
      'mcsl-divider__text-' + textPos,
    ]"
    :style="{
      '--mcsl-divider__spacing': `var(--mcsl-spacing-${spacing})`,
      '--mcsl-divider__bg-color': bgColor,
    }"
    class="mcsl-divider"
  >
    <div class="mcsl-divider__text">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mcsl-divider {
  display: flex;
  align-items: center;
  position: relative;
}

.mcsl-divider__type-horizontal {
  width: 100%;
  padding: var(--mcsl-divider__spacing) 0;

  &::before {
    width: 100%;
    height: 0;
  }

  .mcsl-divider__text {
    margin: 0 var(--mcsl-spacing-2xs);
    padding: 0 var(--mcsl-spacing-2xs);
  }
}

.mcsl-divider__type-vertical {
  height: 100%;
  flex-direction: column;
  padding: 0 var(--mcsl-divider__spacing);

  &::before {
    width: 0;
    height: 100%;
  }

  .mcsl-divider__text {
    margin: var(--mcsl-spacing-2xs) 0;
    padding: var(--mcsl-spacing-2xs) 0;
  }
}

.mcsl-divider::before {
  position: absolute;
  display: block;
  content: "";
  border: 0.5px var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-full);
}

.mcsl-divider.mcsl-divider__variant-solid::before {
  border-style: solid;
}

.mcsl-divider.mcsl-divider__variant-dashed::before {
  border-style: dashed;
}

.mcsl-divider.mcsl-divider__variant-dotted::before {
  border-style: dotted;
}

.mcsl-divider__text {
  z-index: 1;
  background: var(--mcsl-divider__bg-color);
}

.mcsl-divider__text-start {
  justify-content: flex-start;
}

.mcsl-divider__text-center {
  justify-content: center;
}

.mcsl-divider__text-end {
  justify-content: flex-end;
}
</style>
