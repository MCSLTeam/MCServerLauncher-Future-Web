<script lang="ts" setup></script>

<template>
  <div class="mcsl-button-group">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.mcsl-button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
}
</style>

<style lang="scss">
.mcsl-button-group > .mcsl-button {
  margin: 0;

  &:not(:first-child) {
    margin-left: -1px;
  }

  &:hover,
  &:focus-visible {
    z-index: 1;
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
