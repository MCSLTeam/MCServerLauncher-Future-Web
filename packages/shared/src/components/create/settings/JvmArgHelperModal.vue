<script setup lang="ts">
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import SelectButton from "@repo/ui/src/components/form/entries/SelectButton.vue";
import Select from "@repo/ui/src/components/form/entries/Select.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import InputNumber from "@repo/ui/src/components/form/entries/InputNumber.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";

const t = useI18n().t;
const AIKAR_FLAGS =
  "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true";

const jvmArgs = defineModel<string[]>({
  required: true,
});

const visible = defineModel<boolean>("visible", {
  required: true,
});

const pageOptions = [
  { label: t("shared.jvm-arg-helper.memory.title"), value: "memory" },
  { label: t("shared.jvm-arg-helper.encoding.title"), value: "encoding" },
  {
    label: t("shared.jvm-arg-helper.optimization.title"),
    value: "optimization",
  },
];

const heapUnitOptions = [
  { label: "MiB", value: "M" },
  { label: "GiB", value: "G" },
];

const optimizationOptions = [
  {
    label: t("shared.jvm-arg-helper.optimization.aggressive-opts"),
    value: "aggressive_opts",
  },
  {
    label: t("shared.jvm-arg-helper.optimization.aikar-flags"),
    value: "aikar_flags",
  },
];

const page = ref<"memory" | "encoding" | "optimization">("memory");
const memoryHeapMin = ref<number>(1024);
const memoryHeapMax = ref<number>(2048);
const memoryHeapUnit = ref<"M" | "G">("M");
const encoding = ref("");
const optimization = ref<string>();

const canSubmit = computed(() => {
  if (page.value == "memory") {
    return (
      memoryHeapMin.value > 0 &&
      memoryHeapMax.value > 0 &&
      memoryHeapMin.value < memoryHeapMax.value
    );
  }
  if (page.value == "encoding") {
    return encoding.value.trim() != "";
  }
  if (page.value == "optimization") {
    return optimization.value != undefined;
  }
});

function submit() {
  if (page.value == "memory") {
    jvmArgs.value.push(
      "-Xms" + memoryHeapMin.value + memoryHeapUnit.value,
      "-Xmx" + memoryHeapMax.value + memoryHeapUnit.value,
    );
  }
  if (page.value == "encoding") {
    jvmArgs.value.push("-Dfile.encoding=" + encoding.value.trim());
  }
  if (page.value == "optimization") {
    switch (optimization.value) {
      case "aggressive_opts":
        jvmArgs.value.push("-XX:+AggressiveOpts");
        break;
      case "aikar_flags":
        jvmArgs.value = [
          ...jvmArgs.value,
          ...AIKAR_FLAGS.split(" ").toReversed(),
        ];
        break;
    }
  }
  visible.value = false;
}
</script>

<template>
  <!-- TODO: i18n -->
  <Modal
    :visible="visible"
    :header="t('shared.jvm-arg-helper.title')"
    max-width="300px"
  >
    <div class="param-helper__content">
      <SelectButton v-model="page" :options="pageOptions" />
      <transition name="fade" mode="out-in" :duration="250">
        <div v-if="page == 'memory'" class="param-helper__memory">
          <InputNumber v-model="memoryHeapMin" />
          <span>~</span>
          <InputNumber v-model="memoryHeapMax" />
          <Select v-model="memoryHeapUnit" :options="heapUnitOptions" />
        </div>
        <div v-else-if="page == 'encoding'">
          <InputText
            v-model="encoding"
            :placeholder="t('shared.jvm-arg-helper.encoding.placeholder')"
          />
        </div>
        <div v-else-if="page == 'optimization'">
          <Select
            v-model="optimization"
            :options="optimizationOptions"
            placeholder="请选择优化参数..."
          />
        </div>
      </transition>
      <div class="param-helper__buttons">
        <Button @click="visible = false">
          {{ t("ui.common.cancel") }}
        </Button>
        <Button
          type="primary"
          color="primary"
          icon="fa fa-plus"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ t("ui.common.add") }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.param-helper__content {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-xs);
}

.param-helper__memory {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);

  & > div:last-child {
    width: 5rem;
    flex: none;
  }
}

.param-helper__buttons {
  width: 100%;
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  & > button {
    flex: 1;
  }
}
</style>
