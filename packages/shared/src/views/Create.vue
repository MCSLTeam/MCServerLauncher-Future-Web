<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, watchEffect } from "vue";
import SelectMethod from "../components/create/SelectMethod.vue";
import { usePageData } from "../utils/stores.ts";
import SelectDaemon from "../components/create/SelectDaemon.vue";
import { type Core, getCategory, MC_CORES } from "../utils/node/types/cores.ts";
import SelectType from "../components/create/SelectType.vue";
import CreationSettingsItem from "../components/create/settings/CreationSettingsItem.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import FormItem from "@repo/ui/src/components/form/FormItem.vue";
import FileDropper from "@repo/ui/src/components/upload/FileDropper.vue";
import FileDropperOverlay from "@repo/ui/src/components/upload/FileDropperOverlay.vue";
import Message from "@repo/ui/src/components/misc/Message.vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import BaseTextEditor from "@repo/ui/src/components/editor/BaseTextEditor.vue";
import * as yup from "yup";
import JavaSettings from "../components/create/settings/JavaSettings.vue";
import { snakeToPascal } from "../utils/utils.ts";
import type { PageNavigationInfo } from "@repo/ui/src/utils/utils.ts";

const t = useI18n().t;

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: t("shared.create.title"),
      onClick: () => {
        step.value = "method";
      },
    },
  ],
});

const step = ref<"method" | "daemon" | "type" | "settings">("method");
const formName = ref();
const javaSettings = ref();
const showFileError = ref(false);
const showScriptError = ref(false);
const showStartScriptError = ref(false);

const method = ref<"core" | "script" | "pack">();
const daemonId = ref<string>();
const type = ref<Core>();
const name = ref("");
const file = ref<File[]>([]);
const script = ref<string>("");
const startScript = ref<string>("");
const javaPath = ref<string>("");
const jvmArgs = ref<string[]>([]);

watchEffect(() => {
  const breadCrumbs: PageNavigationInfo[] = [];
  switch (step.value) {
    case "settings": {
      let typeLabel: string | undefined = undefined;
      if (type.value == "universal")
        typeLabel = t("shared.instance.type.universal");
      else if (type.value)
        typeLabel = `${t(`shared.instance.type.${getCategory(type.value)}`)} - ${snakeToPascal(type.value)}`;
      if (typeLabel)
        breadCrumbs.push({
          label: typeLabel,
          onClick: () => {
            step.value = "type";
          },
        });
    }
    // eslint-disable-next-line no-fallthrough
    case "type": {
      breadCrumbs.push({
        label: "My Daemon", // TODO: get daemon name
        onClick: () => {
          step.value = "daemon";
        },
      });
    }
    // eslint-disable-next-line no-fallthrough
    case "daemon": {
      breadCrumbs.push({
        label: t(`shared.create.method.${method.value}.title`),
        onClick: () => {
          step.value = "method";
        },
      });
    }
  }
  usePageData().set({
    layout: "dashboard",
    breadcrumbs: [
      {
        label: t("shared.create.title"),
        onClick: () => {
          step.value = "method";
        },
      },
      ...breadCrumbs.toReversed(),
      {
        label: t(`shared.create.${step.value}.title`),
      },
    ],
  });
});

async function submit() {
  let canSubmit = true;
  try {
    await formName.value.validate();
  } catch {
    canSubmit = false;
  }
  if (method.value != "script" && file.value.length == 0) {
    showFileError.value = true;
    canSubmit = false;
  }
  if (method.value == "script" && script.value.trim() == "") {
    showScriptError.value = true;
    canSubmit = false;
  }
  if (!MC_CORES.includes(type.value as any) && startScript.value.trim() == "") {
    showStartScriptError.value = true;
    canSubmit = false;
  }
  try {
    if (MC_CORES.includes(type.value as any))
      await javaSettings.value.validate();
  } catch {
    canSubmit = false;
  }
  if (!canSubmit) return;
  console.log("submit");
}
</script>

<template>
  <transition mode="out-in" name="fade" :duration="250">
    <div class="create" v-if="step == 'method'">
      <SelectMethod v-model="method" @next-step="step = 'daemon'" />
    </div>
    <div class="create" v-else-if="step == 'daemon'">
      <SelectDaemon
        v-model="daemonId"
        @prev-step="step = 'method'"
        @next-step="step = 'type'"
      />
    </div>
    <div class="create" v-else-if="step == 'type'">
      <SelectType
        v-model="type"
        @prev-step="step = 'daemon'"
        @next-step="step = 'settings'"
      />
    </div>
    <div class="create__settings" v-else-if="step == 'settings'">
      <CreationSettingsItem
        :label="t('shared.instance.settings.name.label')"
        :desc="t('shared.instance.settings.name.desc')"
      >
        <!-- TODO: 排除已有名称 -->
        <FormItem
          v-model="name"
          ref="formName"
          :show-label="false"
          :schema="
            yup
              .string()
              .label(t('shared.instance.settings.name.label'))
              .required()
              .notOneOf([])
          "
        >
          <InputText
            :placeholder="t('shared.instance.settings.name.placeholder')"
          />
        </FormItem>
      </CreationSettingsItem>
      <CreationSettingsItem
        v-if="method == 'core'"
        :label="t('shared.create.settings.core.label')"
        :desc="t('shared.create.settings.core.desc')"
      >
        <FileDropper
          v-model="file"
          :config="{ accept: ['application/java-archive'] }"
        />
        <Message
          :visible="showFileError && file.length == 0"
          color="danger"
          variant="text"
        >
          {{ t("shared.create.settings.core.error") }}
        </Message>
      </CreationSettingsItem>
      <CreationSettingsItem
        v-else-if="method == 'script'"
        :label="t('shared.create.settings.script.label')"
        :desc="t('shared.create.settings.script.desc.linux')"
      >
        <!-- TODO: windows: shell -> batch -->
        <FileDropperOverlay
          class="create__script-editor"
          :config="{ maxSize: 1024 * 1024 }"
          @drop="
            async (files: File[]) => {
              if (files[0]) script = await files[0].text();
            }
          "
        >
          <BaseTextEditor v-model="script" :lang="['dos', 'shell']" />
        </FileDropperOverlay>
        <Message
          :visible="showScriptError && script.trim() == ''"
          color="danger"
          variant="text"
        >
          {{ t("shared.create.settings.script.error") }}
        </Message>
      </CreationSettingsItem>
      <JavaSettings
        ref="javaSettings"
        v-model:javaPath="javaPath"
        v-model:jvmArgs="jvmArgs"
        v-if="MC_CORES.includes(type as any)"
      />
      <CreationSettingsItem
        v-else
        :label="t('shared.instance.settings.start-script.label')"
        :desc="t('shared.instance.settings.start-script.desc.linux')"
      >
        <!-- TODO: windows: shell -> batch -->
        <FileDropperOverlay
          class="create__script-editor"
          :config="{ maxSize: 1024 * 1024 }"
          @drop="
            async (files: File[]) => {
              if (files[0]) startScript = await files[0].text();
            }
          "
        >
          <BaseTextEditor v-model="startScript" :lang="['dos', 'shell']" />
        </FileDropperOverlay>
        <Message
          :visible="showStartScriptError && startScript.trim() == ''"
          color="danger"
          variant="text"
        >
          {{ t("shared.instance.settings.start-script.error") }}
        </Message>
      </CreationSettingsItem>
      <Panel class="create__buttons">
        <div class="create__buttons-content">
          <Button @click="step = 'type'">{{ t("ui.common.prev-step") }}</Button>
          <Button type="primary" color="primary" @click="submit">
            {{ t("shared.create.settings.create") }}
          </Button>
        </div>
      </Panel>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.create,
.create__settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);
}

.create {
  justify-content: center;
}

.create__buttons {
  align-self: end;
  @media (max-width: 450px) {
    width: calc(100% - 2 * var(--mcsl-spacing-md));
  }
}

.create__buttons-content {
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  @media (max-width: 768px) {
    & > button {
      flex: 1;
    }
  }
}

.create__script-editor {
  width: 100%;
  height: 10rem;

  & > div:last-child > div {
    height: 100%;
  }
}
</style>
