<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import ButtonGroup from "@repo/ui/src/components/button/ButtonGroup.vue";
import SplitButton from "@repo/ui/src/components/button/SplitButton.vue";
import Badge from "@repo/ui/src/components/misc/Badge.vue";
import Card from "@repo/ui/src/components/panel/Card.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover">
      <template #header>
        <div class="doc-header">
          <div>
            <h2>Style Effects</h2>
            <p>Refined states with quieter tint fills and more grounded spacing.</p>
          </div>
          <Badge value="Buttons" color="help" />
        </div>
      </template>
      <div class="button-stack">
        <ButtonGroup>
          <Button type="primary" color="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="text">Text</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button color="success">Success</Button>
          <Button color="warning">Warning</Button>
          <Button color="danger">Danger</Button>
        </ButtonGroup>
        <SplitButton
          color="primary"
          :dropdown-menu="[
            { label: 'Duplicate style set', onClick: () => {} },
            { label: 'Open implementation notes', onClick: () => {} },
          ]"
        >
          Split Action
        </SplitButton>
      </div>
    </Panel>

    <Panel class="doc-section" shadow="hover">
      <template #header>
        <h2>Live Demo</h2>
      </template>
      <div class="button-stack">
        <ButtonGroup>
          <Button type="primary" color="primary">Primary</Button>
          <Button type="default">Default</Button>
          <Button type="dashed">Dashed</Button>
        </ButtonGroup>
        <Card title="Contained action set" description="Card surfaces should feel grounded and editorial, not inflated.">
          <ButtonGroup>
            <Button type="primary" color="primary">Apply</Button>
            <Button>Cancel</Button>
          </ButtonGroup>
        </Card>
      </div>
    </Panel>

    <Panel class="doc-section" shadow="hover">
      <template #header>
        <h2>API / Props</h2>
      </template>
      <div class="api-table">
        <div class="api-row">
          <div class="api-cell api-cell--head">Component</div>
          <div class="api-cell">Button / ButtonGroup / SplitButton</div>
        </div>
        <div class="api-row">
          <div class="api-cell api-cell--head">Style effects</div>
          <div class="api-cell">Smaller radii, tighter vertical rhythm, softer tint layering, quieter shadows.</div>
        </div>
        <div class="api-row">
          <div class="api-cell api-cell--head">Primary props</div>
          <div class="api-cell">type, color, size, rounded, block, shadow, icon, dropdown-menu</div>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell {
  display: grid;
  gap: 18px;
}

.doc-section :deep(.mcsl-panel__header h2) {
  margin: 0;
  font-size: var(--mcsl-font-size-2xl);
  font-weight: 600;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.doc-header p {
  margin: 6px 0 0;
  color: var(--mcsl-text-color-secondary);
}

.button-stack {
  display: grid;
  gap: 16px;
}

.api-table {
  display: grid;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-md);
  overflow: hidden;
}

.api-row {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
}

.api-row:not(:last-child) {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
}

.api-cell {
  padding: 12px 14px;
}

.api-cell--head {
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  color: var(--mcsl-text-color-secondary);
}
</style>
