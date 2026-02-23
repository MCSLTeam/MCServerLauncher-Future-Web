<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";

defineProps<{
  label: string;
  desc: string;
}>();
</script>

<template>
  <Panel class="creation-settings-item">
    <div class="creation-settings-item__content">
      <h4>{{ label }}</h4>
      <p>
        {{ desc }}
      </p>
      <slot />
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.creation-settings-item {
  width: calc(100% - 2 * var(--mcsl-spacing-md));
}

.creation-settings-item__content {
  display: flex;
  flex-direction: column;

  & > p {
    margin-top: var(--mcsl-spacing-4xs);
    margin-bottom: var(--mcsl-spacing-2xs);
    color: var(--mcsl-text-color-gray);
    font-size: var(--mcsl-font-size-sm);
  }
}
</style>
