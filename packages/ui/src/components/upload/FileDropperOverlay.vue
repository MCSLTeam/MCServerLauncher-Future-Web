<script setup lang="ts">
import { isDragging, type UploadConfig } from "../../utils/upload.ts";
import FileDropper from "./FileDropper.vue";
import type { Size } from "../../utils/utils.ts";
import { animatedVisibilityExists } from "../../utils/utils.ts";

defineProps<{
  config: Partial<UploadConfig>;
  size?: Size;
}>();

defineEmits<(e: "drop", files: File[]) => void>();

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
        class="mcsl-file-dropper-overlay__dropper"
        :config="config"
        :clickable="false"
        :file-info="false"
        :size="size"
        @update:model-value="$emit('drop', $event)"
      />
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";
@use "../Content" as *;

@each $size in utils.$sizes {
  .mcsl-file-dropper-overlay
    > div:first-child
    > .mcsl-size-#{$size}.mcsl-file-dropper-overlay__dropper {
    $padding: calc(utils.get-size-var("spacing", $size, $vars) * 2);
    width: calc(100% - 2 * $padding);
    height: calc(100% - 2 * $padding);
  }
}

.mcsl-file-dropper-overlay {
  transform: translate(0);
}

.mcsl-file-dropper-overlay > div {
  height: 100%;
}

.mcsl-file-dropper-overlay > div:first-child {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 20;
  animation: 0.2s ease-in-out fadeIn;

  &.mcsl-file-dropper-overlay__closing {
    animation: 0.2s ease-in-out fadeOut;
  }
}
</style>
