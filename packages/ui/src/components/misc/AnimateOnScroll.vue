<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import LazyLoad from "./LazyLoad.vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    up?: string;
    down?: string;
    wrap?: boolean;
    default?: "up" | "down" | "none" | string;
    parent?: HTMLElement;
    lazyload?:
      | "v-if"
      | "display-none"
      | "visibility-hidden"
      | "opacity-0"
      | "no";
  }>(),
  {
    wrap: false,
    default: "down",
    lazyload: "no",
  },
);

const lazyLoad = ref();

function getDefaultAnim() {
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
}

const animation = ref(getDefaultAnim());

onMounted(() => {
  watch(
    computed(() => lazyLoad.value.visible),
    (value) => {
      if (value)
        animation.value =
          lazyLoad.value.direction === "up"
            ? (props.up ?? props.down)
            : (props.down ?? props.up);
      else animation.value = undefined;
    },
  );
  watchEffect(() => {});
});
</script>

<template>
  <LazyLoad
    :mode="lazyload == 'no' ? 'always-show' : lazyload"
    :throttle="5"
    :parent="parent"
    ref="lazyLoad"
  >
    <div
      :style="{
        animation,
      }"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </LazyLoad>
</template>

<style lang="scss" scoped>
</style>
