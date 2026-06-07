<script setup lang="ts">
import { Alert, Avatar, CopyableText, Empty, Panel, Result, Skeleton, Table, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
            <template #header><h2>Style Effects</h2></template>
            <div class="doc-stack">
              <div class="inline-row"><Avatar text="MF" /><Tag color="primary">Primary Tag</Tag><Tag color="success">Healthy</Tag></div>
              <CopyableText text="mcsl-future-web" />
              <Empty title="No resources yet" description="Display components should communicate state without over-styling the container." />
            </div>
          </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
            <template #header><h2>Live Demo</h2></template>
            <div class="doc-stack">
              <Alert title="Heads up" color="warning">This is a lightweight alert surface for inline guidance.</Alert>
              <Result title="Deployment completed" description="Use result states for larger success or failure summaries." status="success" />
              <Table :columns="['Name', 'Status', 'Version']" :rows="[['Paper EU-1', 'Running', '1.21.1'], ['Fabric Dev', 'Stopped', '1.20.4']]" />
              <Skeleton :lines="4" height="14px" />
            </div>
          </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Badge, Empty, Skeleton, CopyableText, Avatar, Tag, Alert, Result, Table, Divider, MeterGroup and similar display primitives should all share one spacing and corner system.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.inline-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>
