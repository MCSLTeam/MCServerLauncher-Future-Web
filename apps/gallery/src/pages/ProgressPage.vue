<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import ProgressBar from "@repo/ui/src/components/progress/ProgressBar.vue";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="stack"><ProgressBar :progress="64" status="loading" /><ProgressBar :progress="100" status="success" /><Spinner label="Loading metrics" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="stack"><ProgressBar variant="indeterminate" status="loading" /><Spinner type="spinner" label="Syncing" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">ProgressBar and Spinner should share sizing rhythm and use status colors with lower visual noise.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 16px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>
