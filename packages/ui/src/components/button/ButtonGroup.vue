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
.mcsl-button-group > .mcsl-button,
.mcsl-button-group > .mcsl-dropdown-content {
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
}

.mcsl-button-group > .mcsl-dropdown-content {
  position: relative;
}

.mcsl-button-group > .mcsl-dropdown-content > .mcsl-dropdown-content__triggerer {
  display: flex;
}

.mcsl-button-group > .mcsl-button,
.mcsl-button-group > .mcsl-dropdown-content > .mcsl-dropdown-content__triggerer > .mcsl-button {
  min-width: max-content;
}

.mcsl-button-group > .mcsl-button:not(:first-child):not(:last-child),
.mcsl-button-group > .mcsl-dropdown-content:not(:first-child):not(:last-child) > .mcsl-dropdown-content__triggerer > .mcsl-button {
  border-radius: 0;
}

.mcsl-button-group > .mcsl-button:first-child,
.mcsl-button-group > .mcsl-dropdown-content:first-child > .mcsl-dropdown-content__triggerer > .mcsl-button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.mcsl-button-group > .mcsl-button:last-child,
.mcsl-button-group > .mcsl-dropdown-content:last-child > .mcsl-dropdown-content__triggerer > .mcsl-button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
