<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Sidebar from "@repo/ui/src/components/navigation/Sidebar.vue";
const pages = [{ label: 'Overview' }, { label: 'Instances' }, { label: 'Settings' }];
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Sidebar items should feel calm, aligned, and compact with a stable active state.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Sidebar :pages="pages" /></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">pages, collapsed, color, size and active-state behavior.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>