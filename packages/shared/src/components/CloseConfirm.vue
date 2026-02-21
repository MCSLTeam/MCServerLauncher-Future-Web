<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/button/Button.vue";

defineEmits(["confirm"]);

const t = useI18n().t;

const visible = defineModel<boolean>("visible", {
  default: false,
});
</script>

<template>
  <Modal
    v-model:visible="visible"
    :header="t('shared.close-confirm.title')"
    max-width="300px"
  >
    <p>{{ t("shared.close-confirm.desc") }}</p>
    <div class="close-confirm__actions">
      <Button
        color="danger"
        @click="
          visible = false;
          $emit('confirm');
        "
      >
        {{ t("ui.common.close") }}
      </Button>
      <Button type="primary" color="primary" @click="visible = false">
        {{ t("ui.common.cancel") }}
      </Button>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.close-confirm__actions {
  margin-top: var(--mcsl-spacing-2xs);
  margin-left: auto;
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  & > button {
    flex: 1;
  }
}
</style>
