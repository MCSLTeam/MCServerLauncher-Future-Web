<script setup lang="ts">
import { Checkbox, Panel, Switch } from "@repo/ui";
import { ref } from "vue";

const checked = ref(true);
const mixed = ref<boolean | null>(null);
const enabled = ref(false);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Checkbox</h2></template>
        <div class="toggle-row">
          <Checkbox v-model="checked">Allow snapshots</Checkbox>
          <Checkbox v-model="mixed">Inherited permission</Checkbox>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Toggle</h2></template>
        <div class="toggle-row">
          <Switch v-model="enabled" />
          <span class="doc-note">{{ enabled ? "Daemon auto-start enabled" : "Daemon auto-start disabled" }}</span>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">
          Checkbox accepts boolean or null for tri-state selection. Switch remains a boolean toggle for immediate settings.
        </p>
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
</style>
