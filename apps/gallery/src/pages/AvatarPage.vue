<script setup lang="ts">
import { Avatar, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>
<template><div class="page-shell"><Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Avatars should feel neutral and compact, with image-first but safe fallback behavior.</p></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Avatar text="MF" /><Avatar text="WS" :size="56" /></div></Panel><Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">src, text fallback, and size.</p></Panel></div></template><style scoped lang="scss">.page-shell{display:grid;gap:18px}.stack{display:flex;gap:12px;align-items:center}.note{color:var(--mcsl-text-color-regular);line-height:1.7}.doc-section :deep(.mcsl-panel__header h2){margin:0;font-weight:600}</style>
