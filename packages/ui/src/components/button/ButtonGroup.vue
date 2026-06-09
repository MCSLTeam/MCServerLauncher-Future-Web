<script lang="ts" setup></script>

<template>
  <div class="mcsl-button-group">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.mcsl-button-group {
  isolation: isolate;
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  max-width: 100%;
}
</style>

<style lang="scss">
.mcsl-button-group > .mcsl-button {
  flex: 0 0 auto;
  margin: 0;
  min-width: max-content;

  &:not(:first-child) {
    margin-left: -1px;
  }

  &:hover,
  &:focus-visible {
    z-index: 2;
  }

  &:active {
    z-index: 3;
  }

  &:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  &:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}
</style>
