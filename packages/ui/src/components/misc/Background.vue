<script lang="ts" setup>
import { type Color, getColorVar } from "../../utils/css.ts";
import { useAppearance, useMousePosition } from "../../utils/stores.ts";

withDefaults(
  defineProps<{
    color?: Color;
  }>(),
  {
    color: "primary",
  },
);
</script>

<template>
  <div
    :style="{
      '--mcsl-bg__color': getColorVar(color),
      '--mcsl-bg__mouse-x':
        useAppearance().rendering == 'advanced'
          ? useMousePosition().x + 'px'
          : '-999px',
      '--mcsl-bg__mouse-y':
        useAppearance().rendering == 'advanced'
          ? useMousePosition().y + 'px'
          : '-999px',
    }"
    class="mcsl-bg__container"
  >
    <div class="mcsl-bg__lines" />
    <div class="mcsl-bg__lines" />
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
  transform: translate(0);
  background: linear-gradient(
    utils.transparent(var(--mcsl-bg__color), 5%),
    transparent,
    utils.transparent(var(--mcsl-bg__color), 3%)
  );

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

  & > .mcsl-bg__lines {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: fixed;

    &::before {
      content: "";
      display: block;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(
          to right,
          var(--mcsl-bg__lines-color) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          var(--mcsl-bg__lines-color) 1px,
          transparent 1px
        );
      background-size: 1rem 1rem;
    }
  }

  & > .mcsl-bg__lines:first-child {
    --mcsl-bg__lines-color: #{utils.transparent(
        var(--mcsl-border-color-base),
        50%
      )};
    mask-image: radial-gradient(150vh at 50% 0%, black 0%, transparent 100%);
  }

  & > .mcsl-bg__lines:nth-child(2) {
    --mcsl-bg__lines-color: #{utils.transparent(var(--mcsl-bg__color), 15%)};
    mask-image: radial-gradient(
      200px at var(--mcsl-bg__mouse-x) var(--mcsl-bg__mouse-y),
      black 0%,
      transparent 100%
    );
  }
}
</style>
