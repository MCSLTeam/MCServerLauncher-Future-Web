<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import ProgressBar from "@repo/ui/src/components/progress/ProgressBar.vue";

import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { showCreateInstanceModal } from "../../index.ts";

const t = useI18n().t;

const step = ref(0);
const steps = 3;
</script>

<template>
  <Modal
    v-model:visible="showCreateInstanceModal"
    :header="t('shared.create-instance.title')"
    max-width="700px"
  >
    <ProgressBar
      v-if="step >= 1"
      :progress="(step / steps) * 100"
      :format-label="
        () => `${step} / ${steps} - ${t(`shared.create-instance.step-${step}`)}`
      "
    />
  </Modal>
</template>

<style scoped lang="scss"></style>
