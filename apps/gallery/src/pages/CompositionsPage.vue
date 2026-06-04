<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Card from "@repo/ui/src/components/panel/Card.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Style Effects</h2></template>
      <div class="composition">
        <div class="composition-main">
          <h3>Server Overview</h3>
          <p>Keep the brand color where it helps orientation, but let spacing, typography, and surface hierarchy do most of the work.</p>
        </div>
        <div class="composition-rail">
          <div class="chip">Calmer gradients</div>
          <div class="chip">Smaller radii</div>
          <div class="chip">Softer shadows</div>
          <div class="chip">Clear hierarchy</div>
        </div>
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Live Demo</h2></template>
      <Card title="Settings Section" description="A fuller composition should combine hierarchy, helper text, and calm actions.">
        <p class="note">This section should eventually host full dashboard rows, settings blocks, modal patterns, and list/detail compositions.</p>
      </Card>
    </Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Section shells, rails, chips, content widths, and reusable layout conventions.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.doc-section :deep(.mcsl-panel__header h2), .composition-main h3 { margin: 0; font-weight: 600; }
.composition { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 20px; }
.composition-main p, .note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.composition-rail { display: grid; gap: 10px; }
.chip { padding: 10px 12px; border-radius: calc(var(--mcsl-border-radius-md) - 4px); border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent); background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent); }
@media (max-width: 980px) { .composition { grid-template-columns: 1fr; } }
</style>
