<script setup lang="ts">
import Button from "../button/Button.vue";
import Message from "../misc/Message.vue";
import Modal from "./Modal.vue";
import type { ColorType } from "../../utils/css.ts";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    color?: ColorType;
    autoClose?: boolean;
  }>(),
  {
    title: "Confirm action",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    color: "danger",
    autoClose: true,
  },
);

const visible = defineModel<boolean>("visible", {
  default: false,
});

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function cancel() {
  emit("cancel");
  visible.value = false;
}

function confirm() {
  emit("confirm");
  visible.value = false;
}
</script>

<template>
  <Modal
    v-model:visible="visible"
    :header="title"
    :color="color"
    :auto-close="autoClose"
    max-width="440px"
    class="mcsl-confirm-dialog"
  >
    <Message :title="title" :color="color" variant="text">
      <slot>{{ description }}</slot>
    </Message>
    <div class="mcsl-confirm-dialog__actions">
      <Button type="default" color="surface" @click="cancel">{{ cancelText }}</Button>
      <Button type="primary" :color="color" @click="confirm">{{ confirmText }}</Button>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.mcsl-confirm-dialog__actions {
  display: flex;
  gap: var(--mcsl-spacing-2xs);
  justify-content: flex-end;
  margin-top: var(--mcsl-spacing-sm);
}
</style>
