<script setup lang="ts">
withDefaults(
  defineProps<{
    spacing?: "4xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
    variant?: "solid" | "dotted" | "dashed";
    type?: "horizontal" | "vertical";
    textPos?: "start" | "center" | "end";
  }>(),
  {
    spacing: "md",
    variant: "solid",
    type: "horizontal",
    textPos: "center",
  },
);
</script>

<template>
  <div
    class="mcsl-divider"
    :class="[
      'mcsl-divider__varient-' + variant,
      'mcsl-divider__type-' + type,
      'mcsl-divider__text-' + textPos,
    ]"
    :style="{
      '--mcsl-divider__spacing': `var(--mcsl-spacing-${spacing})`,
    }"
  >
    <div class="mcsl-divider__text">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-divider {
  display: flex;
  justify-content: center;
  position: relative;
}

.mcsl-divider__type-horizontal {
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

.mcsl-divider.mcsl-divider__varient-solid::before {
  border-style: solid;
}

.mcsl-divider.mcsl-divider__varient-dashed::before {
  border-style: dashed;
}

.mcsl-divider.mcsl-divider__varient-dotted::before {
  border-style: dotted;
}

.mcsl-divider__text {
  z-index: 1;
  background: var(--mcsl-bg-color-overlay);
}

.mcsl-divider__text-start {
  align-items: start;
}

.mcsl-divider__text-center {
  align-items: center;
}

.mcsl-divider__text-end {
  align-items: end;
}
</style>
