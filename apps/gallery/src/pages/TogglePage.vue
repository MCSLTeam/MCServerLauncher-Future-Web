<script setup lang="ts">
import { Panel, Switch } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const autoStart = ref(false);
const maintenance = ref(true);
const metrics = ref(true);
const locked = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="toggle-grid">
          <label class="toggle-row">
            <Switch v-model="autoStart" size="small" />
            <span>Small</span>
          </label>
          <label class="toggle-row">
            <Switch v-model="maintenance" color="warning" />
            <span>Warning</span>
          </label>
          <label class="toggle-row">
            <Switch v-model="metrics" color="success" size="large" />
            <span>Large</span>
          </label>
          <label class="toggle-row">
            <Switch v-model="locked" disabled />
            <span>Disabled</span>
          </label>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="toggle-stack">
          <label class="toggle-row">
            <Switch v-model="autoStart" />
            <span>Auto-start daemon</span>
          </label>
          <label class="toggle-row">
            <Switch v-model="maintenance" color="warning" />
            <span>Maintenance mode</span>
          </label>
          <label class="toggle-row">
            <Switch v-model="metrics" color="success" />
            <span>Collect metrics</span>
          </label>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.toggle-grid,
.toggle-stack {
  display: grid;
  gap: 14px;
}

.toggle-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--mcsl-text-color-regular);
}

@media (max-width: 720px) {
  .toggle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
