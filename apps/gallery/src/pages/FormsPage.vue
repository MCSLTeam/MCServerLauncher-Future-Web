<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Style Effects</h2></template>
      <div class="form-preview">
        <div class="field"><label>Instance Name</label><input placeholder="Future Paper EU-1" /></div>
        <div class="field"><label>Runtime</label><div class="select-like">Java 21 · Temurin</div></div>
        <div class="field"><label>Core</label><div class="select-like">paper-1.21.1-43.jar</div></div>
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Live Demo</h2></template>
      <div class="actions"><Button type="primary" color="primary">Save</Button><Button>Preview</Button></div>
    </Panel>
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>API / Props</h2></template>
      <div class="api-note">Core dimensions, label spacing, input height, border contrast, and focus rhythm should stay unified with the rest of the library.</div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-size: var(--mcsl-font-size-2xl); font-weight: 600; }
.form-preview { display: grid; gap: 14px; }
.field { display: grid; gap: 8px; }
.field label { color: var(--mcsl-text-color-regular); }
.field input, .select-like { min-height: 44px; padding: 0 14px; border: 1px solid var(--mcsl-border-color-base); border-radius: calc(var(--mcsl-border-radius-md) - 2px); background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 94%, transparent); display: flex; align-items: center; }
.actions { display: flex; gap: 12px; }
.api-note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
</style>
