<script setup lang="ts">
import { animatedVisibilityExists } from "../../utils/internal.ts";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    inAnim: string;
    outAnim: string;
    animDuration?: number;
    collapse?: "none" | "vertical" | "horizontal" | "both";
  }>(),
  {
    animDuration: 200,
    collapse: "none",
  },
);

const visible = defineModel<boolean>({
  required: true,
});

const { exist, status } = animatedVisibilityExists(
  visible,
  Math.max(props.animDuration, 500),
);

const animation = computed(() => {
  let anim: string = "";
  if (status.value == "in") {
    anim = props.inAnim;
    if (props.collapse == "vertical")
      anim += `, 0.5s ease-in-out both collapseInVertical`;
    if (props.collapse == "horizontal")
      anim += `, 0.5s ease-in-out both collapseInHorizontal`;
  } else if (status.value == "out") {
    anim = props.outAnim;
    if (props.collapse == "vertical")
      anim += `, 1s cubic-bezier(0, 1, 0, 1) both collapseOutVertical`;
    if (props.collapse == "horizontal")
      anim += `, 1s cubic-bezier(0, 1, 0, 1) both collapseOutHorizontal`;
  }
  return anim;
});
</script>

<template>
  <div
    class="mcsl-animated-vif"
    v-if="exist"
    :style="{
      animation: animation,
    }"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mcsl-animated-vif {
  padding: 0;
  overflow: hidden;
}
</style>
