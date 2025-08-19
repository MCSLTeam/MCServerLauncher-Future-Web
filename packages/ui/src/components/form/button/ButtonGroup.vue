<script setup lang="ts"></script>

<template>
  <div class="mcsl-button-group">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mcsl-button-group {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style lang="scss">
.mcsl-button-group > .mcsl-button {
  margin: 0;

  &:focus-visible {
    z-index: 1; // 避免outline被遮挡
  }

  &:not(:nth-child(1)):not(:nth-last-child(1)) {
    border-radius: 0;
  }

  &:nth-child(1) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:nth-last-child(1) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}
</style>
