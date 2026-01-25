<script setup lang="ts">
import ProgressBar from "@repo/ui/src/components/progress/ProgressBar.vue";
import { SimpleTask } from "../../utils/tasks.ts";
import type { Size } from "@repo/ui/src/utils/utils.ts";

withDefaults(
  defineProps<{
    task: SimpleTask;
    variant?: "line" | "circle";
    formatLabel?: (progress: number) => string | undefined;
    size?: Size;
  }>(),
  {
    variant: "line",
    formatLabel: (progress: number) => progress + "%",
  },
);
</script>

<template>
  <ProgressBar
    :progress="task.progress.value"
    :status="task.status.value"
    :size="size"
  />
</template>

<style scoped lang="scss"></style>
