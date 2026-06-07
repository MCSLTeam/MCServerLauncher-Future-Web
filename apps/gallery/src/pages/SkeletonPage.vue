<script setup lang="ts">
import { Panel, Skeleton } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Loading placeholders should feel quiet and never heavier than the real content.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Skeleton :lines="5" height="14px" /></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">width, height, rounded, and number of lines.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>
