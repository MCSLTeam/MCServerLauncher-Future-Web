<script setup lang="ts">
import { Checkbox, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const snapshots = ref(true);
const inherited = ref<boolean | null>(null);
const disabled = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="checkbox-stack">
          <Checkbox v-model="snapshots">Allow snapshots</Checkbox>
          <Checkbox v-model="inherited">Inherited permission</Checkbox>
          <Checkbox v-model="disabled" disabled>Locked policy</Checkbox>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="checkbox-stack">
          <Checkbox v-model="snapshots" size="small">Small checkbox</Checkbox>
          <Checkbox v-model="snapshots">Default checkbox</Checkbox>
          <Checkbox v-model="inherited" color="help">Tri-state checkbox</Checkbox>
          <Checkbox invalid>Invalid checkbox</Checkbox>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.checkbox-stack {
  display: grid;
  gap: 12px;
  align-items: start;
}
</style>
