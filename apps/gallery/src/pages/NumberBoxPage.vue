<script setup lang="ts">
import { InputNumber, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const port = ref(25565);
const memory = ref(4096);
const players = ref(20);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="number-grid">
          <InputNumber v-model="port" :min="1" :max="65535" />
          <InputNumber v-model="memory" :step="512" :min="1024" />
          <InputNumber v-model="players" size="small" :min="1" :max="200" />
          <InputNumber v-model="players" disabled />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="number-grid">
          <label class="field">
            <span>Port</span>
            <InputNumber v-model="port" :min="1" :max="65535" />
          </label>
          <label class="field">
            <span>Memory</span>
            <InputNumber v-model="memory" :step="512" :min="1024" />
          </label>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.number-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
}

@media (max-width: 760px) {
  .number-grid {
    grid-template-columns: 1fr;
  }
}
</style>
