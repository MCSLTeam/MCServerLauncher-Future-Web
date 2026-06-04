<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import DropdownMenu from "@repo/ui/src/components/overlay/DropdownMenu.vue";
import Tooltip from "@repo/ui/src/components/overlay/Tooltip.vue";
import Popover from "@repo/ui/src/components/overlay/Popover.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Overlay surfaces should feel light and precise, not bulky. Corners, borders, and shadows should stay consistent with panels and buttons.</p></Panel>
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Live Demo</h2></template>
      <div class="overlay-demo">
        <DropdownMenu :menu="[{ label: 'Open settings' }, { label: 'Duplicate instance' }, { label: 'Archive', disabled: true }]">
          <template #triggerer="{ toggle }"><Button @click="toggle">Open Menu</Button></template>
        </DropdownMenu>
        <Tooltip content="This is a lightweight tooltip.">
          <template #triggerer="{ toggle }"><Button @mouseenter="toggle" @mouseleave="toggle">Hover me</Button></template>
        </Tooltip>
        <Popover title="Inspector">
          <template #triggerer="{ toggle }"><Button @click="toggle">Open Popover</Button></template>
          <p class="note">Popover content should remain compact and readable.</p>
        </Popover>
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Tooltip, Popover, DropdownMenu, Modal, Contextmenu, FloatingContent: placement, header, close behavior, and trigger slots.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
.overlay-demo { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>
