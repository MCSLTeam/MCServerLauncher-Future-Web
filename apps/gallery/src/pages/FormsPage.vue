<script setup lang="ts">
import { ref } from "vue";
import {
  Button,
  Checkbox,
  InputNumber,
  InputText,
  Panel,
  Select,
  Textarea,
} from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const instanceName = ref("Future Paper EU-1");
const runtime = ref("java-21");
const core = ref("paper-1.21.1-43");
const port = ref(25565);
const memory = ref(4096);
const backups = ref(true);
const note = ref("Production profile with scheduled backup and metrics enabled.");

const runtimeOptions = [
  { label: "Java 21 · Temurin", value: "java-21" },
  { label: "Java 17 · Temurin", value: "java-17" },
  { label: "Java 8 · Zulu", value: "java-8" },
];

const coreOptions = [
  { label: "paper-1.21.1-43.jar", value: "paper-1.21.1-43" },
  { label: "fabric-loader-0.16.9.jar", value: "fabric-0.16.9" },
  { label: "forge-1.20.1-47.3.0.jar", value: "forge-1.20.1" },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="form-grid">
          <label class="field">
            <span>Instance Name</span>
            <InputText v-model="instanceName" placeholder="Future Paper EU-1" />
          </label>
          <label class="field">
            <span>Runtime</span>
            <Select v-model="runtime" :options="runtimeOptions" />
          </label>
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

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="form-grid form-grid--wide">
          <label class="field">
            <span>Server Core</span>
            <Select v-model="core" :options="coreOptions" />
          </label>
          <label class="field">
            <span>Runtime</span>
            <Select v-model="runtime" :options="runtimeOptions" />
          </label>
          <label class="field field--full">
            <span>Notes</span>
            <Textarea v-model="note" resizeable />
          </label>
          <Checkbox v-model="backups">Enable scheduled backups</Checkbox>
          <div class="actions">
            <Button type="primary" color="primary" icon="fas fa-floppy-disk">
              Save
            </Button>
            <Button icon="fas fa-eye">Preview</Button>
          </div>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.form-grid--wide {
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.field--full {
  grid-column: 1 / -1;
}

.field span {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 820px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
