<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Message from "@repo/ui/src/components/misc/Message.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Message surfaces should read clearly with restrained blur and tighter close-button alignment.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="stack"><Message title="Saved" color="success" shadow>Configuration has been updated successfully.</Message><Message title="Warning" color="warning" shadow>One of the selected files will be skipped because it exceeds the accepted size.</Message></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">color, variant, icon, closeable, title, shadow, in/out animations, and slot-based buttons.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>
