<script setup lang="ts">
import { Badge, Button, ButtonGroup, Card, Panel, SplitButton } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
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
    </template>

    <template #demo>
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
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
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
</style>
