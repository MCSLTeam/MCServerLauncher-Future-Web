<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/button/Button.vue";

defineProps<{
  title: string;
}>();

defineEmits(["confirm"]);

const t = useI18n().t;

const visible = defineModel<boolean>("visible", {
  default: false,
});
</script>

<template>
  <Modal
    v-model:visible="visible"
    :header="title"
    max-width="300px"
    :header-divider="false"
    :close-btn="false"
  >
    <div class="confirm__actions">
      <Button
        color="danger"
        @click="
          visible = false;
          $emit('confirm');
        "
      >
        {{ t("ui.common.confirm") }}
      </Button>
      <Button type="primary" color="primary" @click="visible = false">
        {{ t("ui.common.cancel") }}
      </Button>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.confirm__actions {
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  & > button {
    flex: 1;
  }
}
</style>
