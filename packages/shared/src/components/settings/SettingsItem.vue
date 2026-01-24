<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { useI18n } from "vue-i18n";
import { useScreenWidth } from "@repo/ui/src/utils/stores.ts";

defineProps<{
  label: string;
  desc: string;
}>();

const t = useI18n().t;
</script>

<template>
  <Panel border>
    <div class="settings-item">
      <div v-tooltip="useScreenWidth().isXsOrSm ? t(desc) : undefined">
        <h4>{{ t(label) }}</h4>
        <p>
          {{ t(desc) }}
        </p>
      </div>
      <div>
        <slot />
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div:first-child {
    width: calc(100% - 15rem);
    & > p {
      color: var(--mcsl-text-color-gray);
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  & > div:last-child {
    display: flex;
    justify-content: flex-end;
    width: 15rem;
  }
}
</style>
