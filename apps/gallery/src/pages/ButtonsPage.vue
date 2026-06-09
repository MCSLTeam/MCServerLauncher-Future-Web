<script setup lang="ts">
import { Badge, Button, ButtonGroup, Panel, SplitButton } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const menu = [
  { label: "Duplicate", icon: "fas fa-copy" },
  { label: "Export", icon: "fas fa-arrow-up-from-bracket" },
  { label: "Archive", icon: "fas fa-box-archive", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header>
          <div class="doc-heading">
            <h2>Style Effects</h2>
          </div>
        </template>

        <div class="button-layout">
          <div class="button-row">
            <Button type="primary" color="primary" icon="fas fa-check">
              Primary
            </Button>
            <Button icon="fas fa-sliders">Default</Button>
            <Button type="dashed" icon="fas fa-plus">Dashed</Button>
            <Button type="text" icon="fas fa-ellipsis">Text</Button>
          </div>

          <div class="button-row">
            <Button color="success" icon="fas fa-circle-check">Success</Button>
            <Button color="warning" icon="fas fa-triangle-exclamation">
              Warning
            </Button>
            <Button color="danger" icon="fas fa-trash">Danger</Button>
            <Button disabled icon="fas fa-ban">Disabled</Button>
          </div>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>

        <div class="button-layout">
          <section class="button-demo-block">
            <h3>Button Group</h3>
            <ButtonGroup>
              <Button type="primary" color="primary">Start</Button>
              <Button>Restart</Button>
              <Button>Stop</Button>
              <Button type="text" icon="fas fa-gear" squared />
            </ButtonGroup>
          </section>

          <section class="button-demo-block">
            <h3>Split Action</h3>
            <SplitButton color="primary" type="primary" :dropdown-menu="menu">
              Deploy
            </SplitButton>
          </section>

          <section class="button-demo-block">
            <h3>Icon Actions</h3>
            <div class="button-row button-row--compact">
              <Button icon="fas fa-rotate-right" squared />
              <Button icon="fas fa-download" squared />
              <Button icon="fas fa-arrow-up-right-from-square" squared />
              <Button icon="fas fa-xmark" color="danger" squared />
            </div>
          </section>

          <section class="button-demo-block">
            <h3>Loading</h3>
            <div class="button-row">
              <Button loading type="primary" color="primary">Saving</Button>
              <Button loading loading-icon-pos="left">Checking</Button>
            </div>
          </section>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.doc-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.button-layout {
  display: grid;
  gap: 18px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.button-row--compact {
  gap: 8px;
}

.button-demo-block {
  display: grid;
  gap: 10px;
}

.button-demo-block h3 {
  margin: 0;
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  font-weight: 600;
}
</style>
