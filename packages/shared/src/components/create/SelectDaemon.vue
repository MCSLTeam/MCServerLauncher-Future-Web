<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { computed } from "vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import Select from "@repo/ui/src/components/form/entries/Select.vue";

const t = useI18n().t;
const daemonId = defineModel<string | undefined>({
  required: true,
});

defineEmits(["prevStep", "nextStep"]);

const options = computed(() => [
  // TODO: 从后端获取守护进程列表，判断是否已连接有权限
  { label: "守护进程1 - ws://localhost:8080", value: "exampleId" },
]);
</script>

<template>
  <Panel size="large" class="select-daemon">
    <div class="select-daemon__content">
      <div>
        <i class="fa fa-desktop" />
        <h3>{{ t("shared.create.daemon.title") }}</h3>
        <p>{{ t("shared.create.daemon.subtitle") }}</p>
      </div>
      <div>
        <Select
          v-model="daemonId"
          :options="options"
          :placeholder="t('shared.create.daemon.placeholder')"
        />
        <div>
          <Button @click="$emit('prevStep')">
            {{ t("ui.common.prev-step") }}
          </Button>
          <Button
            type="primary"
            color="primary"
            @click="$emit('nextStep')"
            :disabled="!daemonId"
          >
            {{ t("ui.common.next-step") }}
          </Button>
        </div>
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.select-daemon {
  width: min(600px, calc(100% - 2 * var(--mcsl-spacing-lg)));
}

.select-daemon__content {
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--mcsl-spacing-sm);
  }
}

.select-daemon__content > div {
  width: calc(50% - 2 * var(--mcsl-spacing-lg));
  padding: var(--mcsl-spacing-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    padding: 0;
  }

  &:first-child > i {
    font-size: var(--mcsl-font-size-8xl);
    margin-bottom: var(--mcsl-spacing-xs);
  }

  &:last-child {
    & > div {
      width: 100%;
    }

    & > div:last-child {
      display: flex;
      margin-top: var(--mcsl-spacing-md);
      gap: var(--mcsl-spacing-2xs);

      & > button {
        flex: 1;
      }
    }
  }
}
</style>
