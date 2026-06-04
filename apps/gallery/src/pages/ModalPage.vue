<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import Button from "@repo/ui/src/components/button/Button.vue";

const visible = ref(false);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Modal layers should feel elevated but not heavy. Overlay contrast should be supportive, not theatrical.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Button @click="visible = true">Open Modal</Button><Modal v-model:visible="visible" header="Modal Preview"><p class="note">A lighter modal surface with calmer overlay and tighter spacing.</p></Modal></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">visible, header, maxWidth, closeOnEsc, closeOnClickOutside, autoClose, and slot-driven content layout.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>
