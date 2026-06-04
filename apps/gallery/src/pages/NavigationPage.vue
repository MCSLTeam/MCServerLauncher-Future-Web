<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Breadcrumbs from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import Sidebar from "@repo/ui/src/components/navigation/Sidebar.vue";
const crumbs = [{ label: 'MCSL Future' }, { label: 'Gallery' }, { label: 'Navigation' }];
const pages = [{ label: 'Overview' }, { label: 'Instances' }, { label: 'Settings' }];
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="nav-grid"><Panel size="small"><template #header><h4>Breadcrumbs</h4></template><Breadcrumbs :items="crumbs" /></Panel><Panel size="small"><template #header><h4>Sidebar</h4></template><Sidebar :pages="pages" /></Panel></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><p class="note">Navigation should feel structured and stable, with clearer active states and less gelatinous background treatment.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">pages, collapsed, color, size, breadcrumbs list, active-state patterns.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.doc-section :deep(.mcsl-panel__header h2), .doc-section :deep(.mcsl-panel__header h4) { margin: 0; font-weight: 600; }
.nav-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
@media (max-width: 980px) { .nav-grid { grid-template-columns: 1fr; } }
</style>
