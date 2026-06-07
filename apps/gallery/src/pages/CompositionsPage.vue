<script setup lang="ts">
import { Card, Panel, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const qualities = [
  "Calmer gradients",
  "Smaller radii",
  "Softer shadows",
  "Clear hierarchy",
];
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
              Keep the brand color where it helps orientation, but let spacing, typography, and surface hierarchy do most of the work.
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
        <Card title="Settings Section" description="A fuller composition should combine hierarchy, helper text, and calm actions.">
          <p class="doc-note">
            This section should eventually host full dashboard rows, settings blocks, modal patterns, and list/detail compositions.
          </p>
        </Card>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">
          Compositions reuse exported library primitives for section shells, rails, chips, content widths, and layout conventions.
        </p>
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

.composition-main h3 {
  margin: 0;
  font-weight: 600;
}

.composition-main p {
  color: var(--mcsl-text-color-regular);
  line-height: 1.7;
}

.composition-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: start;
}

@media (max-width: 980px) {
  .composition {
    grid-template-columns: 1fr;
  }
}
</style>
