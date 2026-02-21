<script setup lang="ts">
import { isDragging, type UploadConfig } from "../../utils/upload.ts";
import FileDropper from "./FileDropper.vue";
import type { Size } from "../../utils/utils.ts";
import { animatedVisibilityExists } from "../../utils/internal.ts";

defineProps<{
  config: Partial<UploadConfig>;
  size?: Size;
}>();

const files = defineModel<File[]>({
  required: false,
  default: [],
});

const { exist } = animatedVisibilityExists(isDragging, 200);
</script>

<template>
  <div class="mcsl-file-dropper-overlay">
    <div
      v-if="exist"
      :class="{
        'mcsl-file-dropper-overlay__closing': !isDragging,
      }"
    >
      <FileDropper
        v-model="files"
        :config="config"
        :clickable="false"
        :file-info="false"
        :size="size"
      />
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-file-dropper-overlay {
  width: fit-content;
  transform: translate(0);
}

.mcsl-file-dropper-overlay > div:first-child {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  animation: 0.2s ease-in-out fadeIn;
}

.mcsl-file-dropper-overlay__closing {
  animation: 0.2s ease-in-out fadeOut;
}
</style>
