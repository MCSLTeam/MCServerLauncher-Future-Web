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
if (props.config.maxSize ?? 1 < 1) {
  tips.push(t("ui.upload.dropper.tip.multiple"));
}
if (props.config.maxSize ?? 1 > 1) {
  tips.push(
    t("ui.upload.dropper.tip.multiple-count", {
      maxSize: humanReadableSize(props.config.maxSize!),
    }),
  );
}
if ((props.config.accept ?? []).length > 0) {
  tips.push(
    t("ui.upload.dropper.tip.accept", {
      accept: props.config.accept?.join(", "),
    }),
  );
}
if (props.config.maxSize ?? 0 > 0) {
  tips.push(
    t("ui.upload.dropper.tip.size", {
      maxSize: humanReadableSize(props.config.maxSize!),
    }),
  );
}

let interval = -1;

onMounted(() => {
  if (tips.length > 0) {
    currentTip.value = tips[0]!;

    interval = setInterval(() => {
      showTip.value = false;
      setTimeout(() => {
        currentTip.value =
          tips[(tips.indexOf(currentTip.value) + 1) % tips.length]!;
      }, 250);
      setTimeout(() => {
        showTip.value = true;
      }, 500);
    }, 3000);
  }
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
    padding: calc(utils.get-size-var("spacing", $size, $vars) * 2);
  }
}

.mcsl-file-dropper {
  width: 100%;
  min-height: 10rem;
  border: 1.5px dashed var(--mcsl-border-color-base);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &,
  & *:not(.mcsl-file-dropper__subtitle) {
    transition: 0.2s ease-in-out;
  }

  &:hover {
    border-color: var(--mcsl-color-primary);
  }

  &.mcsl-file-dropper__dragging {
    border-style: solid;
    border-color: var(--mcsl-color-primary);
    background-color: #{utils.transparent(var(--mcsl-color-primary), 5%)};

    & i {
      animation: 1s ease-in-out infinite pulse;
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

  & > i {
    font-size: var(--mcsl-font-size-8xl);
    margin-bottom: var(--mcsl-spacing-xs);
  }

  & > h3 {
    color: var(--mcsl-text-color-regular);
    font-size: var(--mcsl-font-size-lg);
  }
}

.mcsl-file-dropper__subtitle {
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-md);
  overflow: hidden;
  max-height: 0;
  transition: 0.3s cubic-bezier(0, 1, 0, 1);
}

.mcsl-file-dropper__subtitle-show {
  max-height: 999px;
  transition: 0.8s ease-in-out;
}

.mcsl-file-dropper__tip {
  color: var(--mcsl-text-color-gray);
  margin-top: var(--mcsl-spacing-4xs);
}

.mcsl-file-dropper__info {
  margin-top: var(--mcsl-spacing-xs);
}
</style>
