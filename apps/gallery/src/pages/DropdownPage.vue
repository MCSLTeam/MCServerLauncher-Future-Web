<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import DropdownMenu from "@repo/ui/src/components/overlay/DropdownMenu.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Dropdowns should feel attached to their trigger, with restrained borders, shadows, and spacing.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><DropdownMenu :menu="[{ label: 'Open settings' }, { label: 'Duplicate instance' }, { label: 'Archive', disabled: true }]"><template #triggerer="{ toggle }"><Button @click="toggle">Open Menu</Button></template></DropdownMenu></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Menu items, disabled states, trigger slots, follow-width behavior, and close-on-click semantics.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>
