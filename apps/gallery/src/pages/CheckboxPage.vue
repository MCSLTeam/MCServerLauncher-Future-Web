<script setup lang="ts">
import { Checkbox, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const enabled = ref(true);
const mixed = ref<boolean | null>(null);
const snapshots = ref(true);
const backups = ref(false);
const inherited = ref<boolean | null>(null);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="state-grid">
          <Checkbox v-model="enabled">Checked</Checkbox>
          <Checkbox v-model="backups">Unchecked</Checkbox>
          <Checkbox v-model="mixed" color="help">Mixed</Checkbox>
          <Checkbox v-model="enabled" disabled>Disabled checked</Checkbox>
          <Checkbox disabled>Disabled</Checkbox>
          <Checkbox invalid>Invalid</Checkbox>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="policy-list">
          <Checkbox v-model="snapshots">Allow snapshot builds</Checkbox>
          <Checkbox v-model="backups" color="success">Run scheduled backups</Checkbox>
          <Checkbox v-model="inherited" color="help">Inherit parent policy</Checkbox>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.state-grid,
.policy-list {
  display: grid;
  gap: 12px;
  align-items: start;
}

.state-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .state-grid {
    grid-template-columns: 1fr;
  }
}
</style>
