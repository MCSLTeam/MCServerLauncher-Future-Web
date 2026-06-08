<script setup lang="ts">
import { Panel, Switch } from "@repo/ui";
import { ref } from "vue";

const enabled = ref(false);
const maintenance = ref(true);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="toggle-row">
          <Switch v-model="enabled" />
          <span class="doc-note">{{ enabled ? "Daemon auto-start enabled" : "Daemon auto-start disabled" }}</span>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Toggle</h2></template>
        <div class="toggle-stack">
          <div class="toggle-row">
            <Switch v-model="enabled" />
            <span class="doc-note">Auto-start daemon</span>
          </div>
          <div class="toggle-row">
            <Switch v-model="maintenance" color="warning" />
            <span class="doc-note">Maintenance mode</span>
          </div>
          <div class="toggle-row">
            <Switch disabled />
            <span class="doc-note">Policy locked</span>
          </div>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.toggle-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.toggle-stack {
  display: grid;
  gap: 14px;
}
</style>
