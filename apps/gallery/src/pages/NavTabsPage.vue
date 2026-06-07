<script setup lang="ts">
import { NavTabs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
const tabs = [{ label: 'Details' }, { label: 'Metrics' }, { label: 'History' }];
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Tab indicators should feel precise and light, not gummy or oversized.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><NavTabs :tabs="tabs" /></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">tabs, color, size, shadow and route-aware activation.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>
