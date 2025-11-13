<script setup lang="ts">
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { platform } from "@tauri-apps/plugin-os";
import { exit } from "@tauri-apps/plugin-process";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { fullscreen } from "../index.ts";

const win = getCurrentWindow();
</script>

<template>
  <div class="window-buttons" v-if="platform() != 'macos'">
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      icon="fa fa-xmark"
      @click="exit()"
    />
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      icon="fa fa-minus"
      @click="win.minimize()"
    />
    <Button
      type="text"
      rounded
      size="small"
      shadow="never"
      :icon="`fa fa-${fullscreen ? 'compress' : 'expand'}`"
      @click="win.setFullscreen(!fullscreen)"
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
