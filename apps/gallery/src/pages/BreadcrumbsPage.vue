<script setup lang="ts">
import { Breadcrumbs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
const crumbs = [{ label: 'MCSL Future' }, { label: 'Gallery' }, { label: 'Breadcrumbs' }];
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Breadcrumbs should recede into the chrome and never compete with the page title.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Breadcrumbs :items="crumbs" /></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">items, separator, icon separator and link activation behavior.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>
