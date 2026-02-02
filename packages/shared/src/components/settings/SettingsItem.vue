<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { useI18n } from "vue-i18n";

defineProps<{
  label: string;
  desc: string;
}>();

const t = useI18n().t;
</script>

<template>
  <Panel>
    <div class="settings-item">
      <div>
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
  gap: var(--mcsl-spacing-2xs);

  @media (max-width: 768px) {
    flex-direction: column;
  }

  & > div:first-child {
    width: 0;
    flex-grow: 1;

    & > p {
      margin-top: var(--mcsl-spacing-4xs);
      color: var(--mcsl-text-color-gray);
      font-size: var(--mcsl-font-size-sm);
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  & > div:last-child {
    display: flex;
    justify-content: flex-end;
    width: 15rem;
    @media (max-width: 768px) {
      width: 100%;
    }
  }
}
</style>
