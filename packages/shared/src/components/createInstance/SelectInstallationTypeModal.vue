<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/button/Button.vue";
import { usePageData } from "../../utils/stores.ts";
import router from "../../router.ts";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { showCreateInstanceModal } from "../../index.ts";

const t = useI18n().t;

usePageData().set({
  breadcrumbs: [
    {
      label: t("shared.create-instance.type.title"),
      path: "/create-instance",
    },
  ],
  layout: "dashboard",
});

function getInstallationTypeIcon(type: "core" | "script" | "pack") {
  switch (type) {
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
  <Modal
    v-model:visible="showCreateInstanceModal"
    :header="t('shared.create-instance.title')"
    max-width="700px"
    body-class="create-instance__panel-body"
    :auto-close="false"
  >
    <div class="select-type">
      <div>
        <i class="fa fa-download" />
        <h3>{{ t("shared.create-instance.type.title") }}</h3>
        <p>{{ t("shared.create-instance.type.subtitle") }}</p>
      </div>
      <div>
        <Button
          v-for="type in ['core', 'script', 'pack']"
          :key="type"
          @click="
            router.push(`/create-instance/${type}`);
            showCreateInstanceModal = false;
          "
          class="select-type__btn"
          v-tooltip="t(`shared.create-instance.type.${type}.desc`)"
          block
          :icon="getInstallationTypeIcon(type as any)"
          size="large"
        >
          {{ t(`shared.create-instance.type.${type}.title`) }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
@use "@repo/ui/src/assets/css/utils";
.select-type {
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--mcsl-spacing-sm);
  }
}

.select-type > div:first-child,
.select-type > div:last-child {
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
}

.select-type > div:first-child {
  & > i {
    font-size: var(--mcsl-font-size-8xl);
    margin-bottom: var(--mcsl-spacing-xs);
  }
}

.select-type > div:last-child {
  gap: var(--mcsl-spacing-2xs);
}
</style>
