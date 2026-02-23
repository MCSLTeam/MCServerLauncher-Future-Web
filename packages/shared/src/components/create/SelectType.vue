<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Accordion from "@repo/ui/src/components/panel/accordion/Accordion.vue";
import AccordionPanel from "@repo/ui/src/components/panel/accordion/AccordionPanel.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import {
  type Core,
  CORE_CATEGORIES,
  type CoreCategory,
  FRPC_CORES,
  MCBE_CORES,
  MCJE_CORES,
  TERRARIA_CORES,
} from "../../utils/node/types/cores.ts";
import { snakeToPascal } from "../../utils/utils.ts";

const t = useI18n().t;
const type = defineModel<Core | undefined>({
  required: true,
});

defineEmits(["prevStep", "nextStep"]);

function getCategoryHeader(category: CoreCategory) {
  if (category == "universal") return t("ui.common.others");
  return t(`shared.instance.type.${category}`);
}

function getSubTypeOptions(category: CoreCategory): {
  label: string;
  value: Core;
}[] {
  switch (category) {
    case "mcje":
      return MCJE_CORES.map((core) => ({
        label: snakeToPascal(core),
        value: core,
      }));
    case "mcbe":
      return MCBE_CORES.map((core) => ({
        label: snakeToPascal(core),
        value: core,
      }));
    case "terraria":
      return TERRARIA_CORES.map((core) => ({
        label: snakeToPascal(core),
        value: core,
      }));
    case "frpc":
      return FRPC_CORES.map((core) => ({
        label: snakeToPascal(core),
        value: core,
      }));
    case "universal":
      return [
        {
          label: t("shared.instance.type.universal"),
          value: "universal",
        },
      ];
  }
}
</script>

<template>
  <Panel size="large" class="select-type">
    <div class="select-type__content">
      <div>
        <i class="fa fa-compact-disc" />
        <h3>{{ t("shared.create.type.title") }}</h3>
      </div>
      <div class="select-type__accordion">
        <Accordion>
          <AccordionPanel
            v-for="category in CORE_CATEGORIES"
            :name="category"
            :key="category"
            size="small"
          >
            <template #header>
              <h5>{{ getCategoryHeader(category) }}</h5>
            </template>
            <div class="select-type__subtypes">
              <Button
                v-for="subType in getSubTypeOptions(category)"
                :key="subType.value"
                block
                @click="
                  () => {
                    type = subType.value;
                    $emit('nextStep');
                  }
                "
              >
                {{ subType.label }}
              </Button>
            </div>
          </AccordionPanel>
        </Accordion>
      </div>
      <Button @click="$emit('prevStep')">
        {{ t("ui.common.prev-step") }}
      </Button>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.select-type {
  width: min(600px, calc(100% - 2 * var(--mcsl-spacing-lg)));
}

.select-type__content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: var(--mcsl-spacing-xs);

  & > button {
    align-self: flex-end;
  }
}

.select-type__content > div {
  width: 100%;
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  &:first-child {
    align-items: center;

    & > i {
      font-size: var(--mcsl-font-size-lg);
    }
  }
}

.select-type__accordion {
  height: 19rem;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-md);
  overflow: auto;

  & > div > div:last-child {
    border: none;
  }
}

.select-type__subtypes {
  max-height: 15rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-4xs);
}
</style>
