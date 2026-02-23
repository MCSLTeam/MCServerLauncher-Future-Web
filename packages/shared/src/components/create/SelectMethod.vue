<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/button/Button.vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";

const t = useI18n().t;
const method = defineModel<"core" | "script" | "pack" | undefined>({
  required: true,
});

defineEmits(["nextStep"]);

function getMethodIcon(method: "core" | "script" | "pack") {
  switch (method) {
    case "core":
      return "fa fa-compact-disc";
    case "script":
      return "fa fa-terminal";
    case "pack":
      return "fa fa-file-zipper";
  }
}
</script>

<template>
  <div class="select-method">
    <Panel size="large" class="select-method__panel">
      <div class="select-method__content">
        <div>
          <i class="fa fa-download" />
          <h3>{{ t("shared.create.method.title") }}</h3>
          <p>{{ t("shared.create.method.subtitle") }}</p>
        </div>
        <div>
          <Button
            v-for="mth in ['core', 'script', 'pack'] as const"
            :key="mth"
            @click="
              () => {
                method = mth;
                $emit('nextStep');
              }
            "
            class="select-method__btn"
            v-tooltip="t(`shared.create.method.${mth}.desc`)"
            block
            :icon="getMethodIcon(mth)"
            size="large"
          >
            {{ t(`shared.create.method.${mth}.title`) }}
          </Button>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.select-method {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.select-method__panel {
  width: min(600px, calc(100% - 2 * var(--mcsl-spacing-lg)));
}

.select-method__content {
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--mcsl-spacing-sm);
  }
}

.select-method__content > div {
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
    gap: var(--mcsl-spacing-2xs);
  }
}
</style>
