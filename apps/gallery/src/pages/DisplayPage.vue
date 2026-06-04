<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Empty from "@repo/ui/src/components/misc/Empty.vue";
import Skeleton from "@repo/ui/src/components/misc/Skeleton.vue";
import CopyableText from "@repo/ui/src/components/misc/CopyableText.vue";
import Avatar from "@repo/ui/src/components/misc/Avatar.vue";
import Tag from "@repo/ui/src/components/misc/Tag.vue";
import Alert from "@repo/ui/src/components/misc/Alert.vue";
import Result from "@repo/ui/src/components/misc/Result.vue";
import Table from "@repo/ui/src/components/misc/Table.vue";
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Style Effects</h2></template>
      <div class="stack">
        <div class="inline-row"><Avatar text="MF" /><Tag color="primary">Primary Tag</Tag><Tag color="success">Healthy</Tag></div>
        <CopyableText text="mcsl-future-web" />
        <Empty title="No resources yet" description="Display components should communicate state without over-styling the container." />
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover">
      <template #header><h2>Live Demo</h2></template>
      <div class="stack">
        <Alert title="Heads up" color="warning">This is a lightweight alert surface for inline guidance.</Alert>
        <Result title="Deployment completed" description="Use result states for larger success or failure summaries." status="success" />
        <Table :columns="['Name', 'Status', 'Version']" :rows="[['Paper EU-1', 'Running', '1.21.1'], ['Fabric Dev', 'Stopped', '1.20.4']]" />
        <Skeleton :lines="4" height="14px" />
      </div>
    </Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Badge, Empty, Skeleton, CopyableText, Avatar, Tag, Alert, Result, Table, Divider, MeterGroup and similar display primitives should all share one spacing and corner system.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 16px; }
.inline-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>
