<script setup lang="ts">
import { windowButtons } from "../../index.ts";
import Button from "@repo/ui/src/components/form/button/Button.vue";
</script>

<template>
  <div class="window-buttons" v-if="windowButtons">
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      icon="fa fa-xmark"
      @click="windowButtons.close"
    />
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      icon="fa fa-minus"
      @click="windowButtons.minimize"
    />
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      :icon="`fa fa-${windowButtons.fullscreen ? 'compress' : 'expand'}`"
      @click="(windowButtons.fullscreen as any) = !windowButtons.fullscreen"
    />
  </div>
</template>

<style scoped lang="scss">
.window-buttons {
  position: absolute;
  top: var(--mcsl-spacing-xl);
  left: var(--mcsl-spacing-xl);
  width: 5rem;
  height: 1rem;
  display: flex;
  align-items: center;
}
</style>
