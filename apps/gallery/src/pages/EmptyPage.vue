<script setup lang="ts">
import { Empty, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Empty states should be sparse, structured, and calm.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Empty title="No running instances" description="Create a new instance or import an existing configuration to continue." /></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">title, description, icon and custom slot content.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>
