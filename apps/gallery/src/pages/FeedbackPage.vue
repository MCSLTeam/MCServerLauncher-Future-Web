<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Empty from "@repo/ui/src/components/misc/Empty.vue";
import Skeleton from "@repo/ui/src/components/misc/Skeleton.vue";
import MeterGroup from "@repo/ui/src/components/misc/MeterGroup.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Style Effects</h2></template>
      <div class="status-grid">
        <Panel size="small"><template #header><h4>Healthy</h4></template><p>CPU 18% · Memory 1.2 GB · Network stable</p><MeterGroup :meter="{ length: 100, values: [{ label: 'CPU', length: 18, type: 'success' }, { label: 'RAM', length: 42, type: 'primary' }] }" /></Panel>
        <Panel size="small"><template #header><h4>Attention</h4></template><p>Packet queue rising · latency increased</p><MeterGroup :meter="{ length: 100, values: [{ label: 'Latency', length: 64, type: 'warning' }, { label: 'Disk', length: 51, type: 'help' }] }" /></Panel>
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="feedback-stack"><Empty title="No running instances" description="Use this state to explain the next meaningful action without adding too much decorative UI." /><Skeleton :lines="3" height="14px" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Status color, density, severity emphasis, and compact summary patterns.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.doc-section :deep(.mcsl-panel__header h2), .doc-section :deep(.mcsl-panel__header h4) { margin: 0; font-weight: 600; }
.status-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
@media (max-width: 980px) { .status-grid { grid-template-columns: 1fr; } }
</style>
