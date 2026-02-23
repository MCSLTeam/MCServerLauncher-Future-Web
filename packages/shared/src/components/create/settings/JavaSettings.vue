<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CreationSettingsItem from "./CreationSettingsItem.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import FormItem from "@repo/ui/src/components/form/FormItem.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import Message from "@repo/ui/src/components/misc/Message.vue";
import * as yup from "yup";
import { ref } from "vue";
import JavaSearchModal from "./JavaSearchModal.vue";
import JvmArgHelperModal from "./JvmArgHelperModal.vue";
import { renderHtml } from "@repo/ui/src/utils/render.ts";

const t = useI18n().t;

const javaPath = defineModel<string>("javaPath", {
  required: true,
});

const jvmArgs = defineModel<string[]>("jvmArgs", {
  required: true,
});

const showJavaSearchModal = ref(false);
const showHelperModal = ref(false);
const formJavaPath = ref();
const jvmArgsInput = ref("");

function addArg() {
  const input = jvmArgsInput.value.trim();
  if (input != "") jvmArgs.value.push(input);
  jvmArgsInput.value = "";
}

defineExpose({
  async validate() {
    await formJavaPath.value.validate();
  },
});
</script>

<template>
  <!-- TODO: i18n -->
  <JavaSearchModal v-model="javaPath" v-model:visible="showJavaSearchModal" />
  <JvmArgHelperModal v-model="jvmArgs" v-model:visible="showHelperModal" />
  <CreationSettingsItem
    :label="t('shared.instance.settings.java-path.label')"
    :desc="t('shared.instance.settings.java-path.desc')"
  >
    <FormItem
      ref="formJavaPath"
      v-model="javaPath"
      :show-label="false"
      :schema="
        yup
          .string()
          .label(t('shared.instance.settings.java-path.label'))
          .required()
      "
    >
      <div class="java-settings__input-bar">
        <InputText
          :placeholder="t('shared.instance.settings.java-path.placeholder')"
          clearable
        />
        <div>
          <Button icon="fa fa-search" @click="showJavaSearchModal = true">
            {{ t("shared.java-search.button") }}
          </Button>
          <Button icon="fa fa-download">{{
            t("shared.java-install.button")
          }}</Button>
          <div>
            <Button
              icon="fa fa-question"
              v-tooltip="{
                content: renderHtml(
                  t('shared.instance.settings.java-path.tip'),
                ),
                html: true,
              }"
            />
          </div>
        </div>
      </div>
    </FormItem>
  </CreationSettingsItem>
  <CreationSettingsItem
    :label="t('shared.instance.settings.jvm-args.label')"
    :desc="t('shared.instance.settings.jvm-args.desc')"
  >
    <div class="java-settings__input-bar">
      <InputText
        v-model="jvmArgsInput"
        :placeholder="t('shared.instance.settings.jvm-args.placeholder')"
        @keydown.enter="addArg"
        clearable
      />
      <div>
        <Button icon="fa fa-screwdriver-wrench" @click="showHelperModal = true">
          {{ t("shared.jvm-arg-helper.button") }}
        </Button>
        <Button
          type="primary"
          color="primary"
          icon="fa fa-plus"
          @click="addArg"
        >
          {{ t("ui.common.add") }}
        </Button>
      </div>
    </div>
    <Message
      v-for="arg in jvmArgs.toReversed()"
      :key="arg"
      closeable
      icon="fa fa-angle-right"
      color="surface"
      variant="text"
      @closed="jvmArgs = jvmArgs.filter((a) => a != arg)"
      class="java-settings__jvm-args-arg"
    >
      <template #close-btn="{ close }">
        <Button
          color="danger"
          icon="fa fa-trash-can"
          rounded
          type="text"
          @click="close"
        />
      </template>
      <code>{{ arg }}</code>
    </Message>
  </CreationSettingsItem>
</template>

<style scoped lang="scss">
.java-settings__input-bar {
  width: 100%;

  &,
  & > div:not(button) {
    display: flex;
    gap: var(--mcsl-spacing-4xs);
  }

  @media (max-width: 450px) {
    flex-direction: column;

    & > div:not(button) > button {
      flex: 1;
    }
  }
}

.java-settings__jvm-args-arg {
  margin-top: var(--mcsl-spacing-2xs);
  & code {
    display: block;
    width: calc(100% - 15px - var(--mcsl-spacing-4xs));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
