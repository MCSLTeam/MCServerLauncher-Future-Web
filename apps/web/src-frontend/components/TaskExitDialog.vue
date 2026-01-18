<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { useI18n } from "vue-i18n";
import { disableTaskExitDialog, showTaskExitDialog } from "../index.ts";
import FormItem from "@repo/ui/src/components/form/FormItem.vue";
import Checkbox from "@repo/ui/src/components/form/entries/Checkbox.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import * as yup from "yup";

const t = useI18n().t;
</script>

<template>
  <Modal
    color="warning"
    width="400px"
    :visible="showTaskExitDialog"
    :closable="false"
    :header="t('ui.notification.title.warning')"
  >
    <p>{{ t("web.tasks.exit-dialog") }}</p>
    <FormItem
      class="task-exit-dialog__checkbox"
      v-model="disableTaskExitDialog"
      label-pos="right"
      width="fit-content"
      gap="4xs"
      :schema="yup.boolean().label(t('ui.common.do-not-show-again'))"
    >
      <Checkbox />
    </FormItem>
    <Button
      class="task-exit-dialog__ok"
      type="primary"
      color="primary"
      @click="showTaskExitDialog = false"
    >
      {{ t("ui.common.ok") }}
    </Button>
  </Modal>
</template>

<style scoped lang="scss">
.task-exit-dialog__checkbox {
  margin: var(--mcsl-spacing-xs) 0;
}

.task-exit-dialog__ok {
  margin-left: auto;
}
</style>
