<script lang="ts" setup>
import { type Color, getColorVar } from "../../utils/css.ts";

withDefaults(
  defineProps<{
    baseColor?: Color;
    primaryColor?: Color;
    secondaryColor?: Color;
  }>(),
  {
    primaryColor: "green",
    secondaryColor: "blue",
  },
);
</script>

<template>
  <div
    :style="{
      '--mcsl-bg__primary-color': getColorVar(primaryColor),
      '--mcsl-bg__secondary-color': getColorVar(secondaryColor),
    }"
    class="mcsl-bg__container"
  >
    <div class="mcsl-bg__circle mcsl-bg__circle-1" />
    <div class="mcsl-bg__circle mcsl-bg__circle-2" />
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
    filter: blur(250px);
    position: fixed;
    border-radius: var(--mcsl-border-radius-full);
  }

  .mcsl-bg__circle-1 {
    bottom: -5%;
    right: -10%;
    width: 60%;
    height: 60%;
    background: utils.transparent(var(--mcsl-bg__secondary-color), 10%);
  }

  .mcsl-bg__circle-2 {
    bottom: -5%;
    left: -10%;
    width: 60%;
    height: 60%;
    background: utils.transparent(var(--mcsl-bg__primary-color), 10%);
  }
}
</style>
