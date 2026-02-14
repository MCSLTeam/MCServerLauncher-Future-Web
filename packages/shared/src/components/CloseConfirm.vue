<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";

defineEmits(["confirm"]);

const t = useI18n().t;
const show = ref(false);

defineExpose({
  show() {
    show.value = true;
  },
});
</script>

<template>
  <Modal
    v-model:visible="show"
    :header="t('shared.close-confirm.title')"
    max-width="300px"
  >
    <p>{{ t("shared.close-confirm.desc") }}</p>
    <div class="create-instance__actions">
      <Button
        color="danger"
        @click="
          show = false;
          $emit('confirm');
        "
      >
        {{ t("shared.close-confirm.confirm") }}
      </Button>
      <Button type="primary" color="primary" @click="show = false">
        {{ t("shared.close-confirm.cancel") }}
      </Button>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.create-instance__actions {
  width: fit-content;
  margin-top: var(--mcsl-spacing-2xs);
  margin-left: auto;
  display: flex;
  gap: var(--mcsl-spacing-2xs);
}
</style>
