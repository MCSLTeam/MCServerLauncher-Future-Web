<script lang="ts" setup>
import { computed, ref } from "vue";
import LazyLoad, { type ScrollInfo } from "./LazyLoad.vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    up?: string;
    down?: string;
    nowrap?: boolean;
    default?: "up" | "down" | "none" | string;
    lazyload?:
      | "v-if"
      | "display-none"
      | "visibility-hidden"
      | "opacity-0"
      | "no";
  }>(),
  {
    nowrap: false,
    default: "down",
    lazyload: "no",
  },
);

const info = ref<ScrollInfo>();

const defaultAnimation = computed(() => {
  switch (props.default) {
    case "up":
      return props.up ?? props.down;
    case "down":
      return props.down ?? props.up;
    case "none":
      return undefined;
    default:
      return props.default;
  }
});

const animation = computed(() => {
  if (!info.value) return defaultAnimation.value;
  if (info.value.type === "in") {
    switch (info.value.direction) {
      case "up":
        return props.up ?? props.down;
      case "down":
        return props.down ?? props.up;
    }
  }
  return undefined;
});
</script>

<template>
  <LazyLoad
    :mode="lazyload == 'no' ? 'always-show' : lazyload"
    :throttle="5"
    @update="info = $event"
  >
    <div
      :class="{
        'mcsl-animate-on-scroll__wrap': !nowrap,
        'mcsl-animate-on-scroll__nowrap': nowrap,
      }"
      :style="{
        '--mcsl-animate-on-scroll__animation': animation,
      }"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </LazyLoad>
</template>

<style lang="scss" scoped>
.mcsl-animate-on-scroll__wrap {
  animation: var(--mcsl-animate-on-scroll__animation);
}

.mcsl-animate-on-scroll__nowrap {
  & > * {
    animation: var(--mcsl-animate-on-scroll__animation);
  }
}
</style>
