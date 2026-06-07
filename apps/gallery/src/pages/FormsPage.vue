<script setup lang="ts">
import { ref } from "vue";
import { Button, InputText, Panel, Select } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const instanceName = ref("Future Paper EU-1");
const runtime = ref("java-21");
const core = ref("paper-1.21.1-43");

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
        <div class="form-preview">
          <label class="field">
            <span>Instance Name</span>
            <InputText v-model="instanceName" placeholder="Future Paper EU-1" />
          </label>
          <label class="field">
            <span>Runtime</span>
            <Select v-model="runtime" :options="runtimeOptions" />
          </label>
          <label class="field">
            <span>Core</span>
            <Select v-model="core" :options="coreOptions" />
          </label>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="actions">
          <Button type="primary" color="primary">Save</Button>
          <Button>Preview</Button>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <div class="api-note">
          Form demos use real input and select primitives so label spacing, input height, border contrast, and focus rhythm stay unified with the library.
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.form-preview {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: var(--mcsl-text-color-regular);
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.api-note {
  color: var(--mcsl-text-color-regular);
  line-height: 1.7;
}
</style>
