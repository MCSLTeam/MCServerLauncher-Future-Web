<script lang="ts" setup>
import { type Color, getColorVar } from "../../utils/css.ts";

withDefaults(
  defineProps<{
    baseColor?: Color;
    primaryColor?: Color;
    secondaryColor?: Color;
  }>(),
  {
    baseColor: "green",
    primaryColor: "blue",
    secondaryColor: "cyan",
  },
);
</script>

<template>
  <div
    :style="{
      '--mcsl-bg__base-color': getColorVar(baseColor),
      '--mcsl-bg__primary-color': getColorVar(primaryColor),
      '--mcsl-bg__secondary-color': getColorVar(secondaryColor),
    }"
    class="mcsl-bg__container"
  >
    <div
      v-for="i in 4"
      :key="i"
      :class="['mcsl-bg__circle', `mcsl-bg__circle-${i}`]"
    />
    <div class="mcsl-bg__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";

.mcsl-bg__container {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > .mcsl-bg__content {
    width: 100%;
    height: 100%;
    margin: 0;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .mcsl-bg__circle {
    filter: blur(500px);
    position: fixed;
    border-radius: var(--mcsl-border-radius-full);
  }

  .mcsl-bg__circle-1 {
    top: -5%;
    left: -5%;
    width: 55%;
    height: 60%;
    background: utils.transparent(var(--mcsl-bg__primary-color), 50%);
  }

  .mcsl-bg__circle-2 {
    bottom: -5%;
    right: -5%;
    width: 60%;
    height: 60%;
    background: utils.transparent(var(--mcsl-bg__secondary-color), 50%);
  }

  .mcsl-bg__circle-3 {
    top: -5%;
    right: -5%;
    width: 50%;
    height: 45%;
    background: utils.transparent(var(--mcsl-bg__base-color), 25%);
  }

  .mcsl-bg__circle-4 {
    bottom: -5%;
    left: -5%;
    width: 45%;
    height: 45%;
    background: utils.transparent(var(--mcsl-bg__base-color), 25%);
  }
}
</style>
