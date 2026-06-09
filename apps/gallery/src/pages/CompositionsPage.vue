<script setup lang="ts">
import {
  Button,
  Card,
  Message,
  MeterGroup,
  NavTabs,
  Panel,
  Tag,
} from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const qualities = [
  "Calmer surfaces",
  "Smaller radii",
  "Softer shadows",
  "Clear hierarchy",
];

const tabs = [
  { label: "Overview", icon: "fas fa-gauge" },
  { label: "Console", icon: "fas fa-terminal" },
  { label: "Backups", icon: "fas fa-clock-rotate-left" },
];

const meter = {
  length: 100,
  values: [
    { label: "CPU", length: 18, type: "success" },
    { label: "RAM", length: 42, type: "primary" },
    { label: "Disk", length: 64, type: "warning" },
  ],
};
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="composition">
          <div class="composition-main">
            <h3>Server Overview</h3>
            <p>
              Brand color guides orientation while spacing, typography, and surface hierarchy do most of the work.
            </p>
          </div>
          <div class="composition-rail">
            <Tag v-for="quality in qualities" :key="quality">{{ quality }}</Tag>
          </div>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="instance-shell">
          <div class="instance-header">
            <div>
              <h3>Paper EU-1</h3>
              <div class="tag-row">
                <Tag color="success">Online</Tag>
                <Tag color="primary">Java 21</Tag>
                <Tag color="help">Paper</Tag>
              </div>
            </div>
            <Button type="primary" color="primary" icon="fas fa-terminal">Console</Button>
          </div>
          <NavTabs :tabs="tabs" />
          <Card title="Runtime" description="Current resource allocation and process health.">
            <div class="card-stack">
              <MeterGroup :meter="meter" />
              <Message title="Stable" color="success">
                CPU, memory, and disk usage are inside the expected range.
              </Message>
            </div>
          </Card>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 20px;
}

.composition-main h3,
.instance-header h3 {
  margin: 0;
  font-weight: 600;
}

.composition-main p {
  color: var(--mcsl-text-color-regular);
  line-height: 1.7;
}

.composition-rail,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: start;
}

.instance-shell,
.card-stack {
  display: grid;
  gap: 16px;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

@media (max-width: 980px) {
  .composition,
  .instance-header {
    grid-template-columns: 1fr;
  }

  .instance-header {
    flex-direction: column;
  }
}
</style>
