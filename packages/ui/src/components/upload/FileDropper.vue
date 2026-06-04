<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  handleUpload,
  isDragging,
  openFileSelector,
  type UploadConfig,
} from "../../utils/upload.ts";
import { humanReadableSize, type Size } from "../../utils/utils.ts";
import { onMounted, onUnmounted, ref } from "vue";
import { MCSLNotif } from "../../utils/notifications.ts";
import FileInfo from "./FileInfo.vue";
import mime from "mime";

const props = withDefaults(
  defineProps<{
    config: Partial<UploadConfig>;
    clearOnSelect?: boolean;
    fileInfo?: boolean;
    clickable?: boolean;
    size?: Size;
  }>(),
  {
    clearOnSelect: true,
    fileInfo: true,
    clickable: true,
    size: "medium",
  },
);

const files = defineModel<File[]>({
  required: false,
  default: [],
});

const t = useI18n().t;

function setFiles(newValue: File[]) {
  if (newValue.length == 0) return;
  if (!props.clearOnSelect) newValue = [...newValue, ...files.value];
  newValue = Array.from(new Set(newValue));
  const maxCount = props.config.maxCount ?? 0;
  if (maxCount > 0 && newValue.length > maxCount) {
    files.value = newValue.slice(0, maxCount);
    new MCSLNotif({
      data: {
        title: t("ui.notification.title.warning"),
        message: t("ui.upload.error.count", { maxCount }),
      },
    }).open();
  } else files.value = newValue;
}

function handleDrop(e: DragEvent) {
  const droppedFiles = e.dataTransfer?.files;
  if (!droppedFiles) return;
  setFiles(handleUpload(droppedFiles, props.config));
}

async function handleClick() {
  try {
    setFiles(await openFileSelector(props.config));
  } catch {
    /* ignored */
  }
}

const currentTip = ref("");
const showTip = ref(true);
const tips: string[] = [];
if ((props.config.maxCount ?? 1) < 1) {
  tips.push(t("ui.upload.dropper.tip.multiple"));
}
if ((props.config.maxCount ?? 1) > 1) {
  tips.push(
    t("ui.upload.dropper.tip.multiple-count", {
      maxCount: props.config.maxCount,
    }),
  );
}
if ((props.config.accept ?? []).length > 0) {
  tips.push(
    t("ui.upload.dropper.tip.accept", {
      accept: props.config.accept!.map((m) => mime.getExtension(m)).join(", "),
    }),
  );
}
if ((props.config.maxSize ?? 0) > 0) {
  tips.push(
    t("ui.upload.dropper.tip.size", {
      maxSize: humanReadableSize(props.config.maxSize!),
    }),
  );
}

let interval = -1;

onMounted(() => {
  if (tips.length > 0) currentTip.value = tips[0]!;
  if (tips.length > 1)
    interval = window.setInterval(() => {
      showTip.value = false;
      setTimeout(() => {
        currentTip.value =
          tips[(tips.indexOf(currentTip.value) + 1) % tips.length]!;
      }, 250);
      setTimeout(() => {
        showTip.value = true;
      }, 500);
    }, 3000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div
    class="mcsl-file-dropper"
    :class="{
      [`mcsl-size-${size}`]: size,
      'mcsl-file-dropper__dragging': isDragging,
    }"
    @dragover.prevent=""
    @drop.prevent="handleDrop"
    @click="handleClick"
  >
    <div class="mcsl-file-dropper__content">
      <i class="fa fa-upload" />
      <h3>{{ t("ui.upload.dropper.title") }}</h3>
      <h4
        class="mcsl-file-dropper__subtitle"
        :class="{
          'mcsl-file-dropper__subtitle-show': clickable && !isDragging,
        }"
      >
        {{ t("ui.upload.dropper.subtitle") }}
      </h4>
      <p
        class="mcsl-file-dropper__tip"
        :style="{
          opacity: showTip ? 1 : 0,
        }"
      >
        {{ currentTip }}
      </p>
    </div>
    <FileInfo class="mcsl-file-dropper__info" v-if="fileInfo" v-model="files" />
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";
@use "../Content" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-file-dropper {
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    $padding: calc(utils.get-size-var("spacing", $size, $vars) * 2);
    padding: $padding;
    width: calc(100% - 2 * $padding);
  }
}

.mcsl-file-dropper {
  min-height: 10rem;
  border: 1px dashed color-mix(in srgb, var(--mcsl-border-color-base) 86%, transparent);
  border-radius: var(--mcsl-border-radius-md);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition:
    border-color 0.14s ease-out,
    background-color 0.14s ease-out,
    color 0.14s ease-out,
    transform 0.14s ease-out;

  &:hover {
    border-color: color-mix(in srgb, var(--mcsl-color-primary) 28%, var(--mcsl-border-color-base));
    background: color-mix(in srgb, var(--mcsl-color-primary) 4%, var(--mcsl-bg-color-overlay));
  }

  &.mcsl-file-dropper__dragging {
    border-style: solid;
    border-color: var(--mcsl-color-primary);
    background-color: #{utils.transparent(var(--mcsl-color-primary), 6%)};
    transform: scale(0.995);

    & i {
      transform: translateY(-2px);
      color: var(--mcsl-color-primary);
    }

    & *:not(.mcsl-file-dropper__subtitle) {
      color: var(--mcsl-color-primary);
    }
  }
}

.mcsl-file-dropper__content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;

  & > i {
    font-size: calc(var(--mcsl-font-size-8xl) - 0.5rem);
    margin-bottom: var(--mcsl-spacing-2xs);
    transition: transform 0.14s ease-out, color 0.14s ease-out;
  }

  & > h3 {
    color: var(--mcsl-text-color-primary);
    font-size: var(--mcsl-font-size-lg);
    font-weight: 600;
  }
}

.mcsl-file-dropper__subtitle {
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-md);
  opacity: 0;
  transition: opacity 0.14s ease-out;
}

.mcsl-file-dropper__subtitle-show {
  opacity: 1;
}

.mcsl-file-dropper__tip {
  color: var(--mcsl-text-color-secondary);
  margin-top: var(--mcsl-spacing-4xs);
}

.mcsl-file-dropper__info {
  margin-top: var(--mcsl-spacing-sm);
}
</style>
