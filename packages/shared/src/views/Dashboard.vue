<script setup lang="ts">
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";
import { getExecutableType } from "../utils/node/types/instanceInstallationType.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { ref } from "vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import BaseTextEditor from "@repo/ui/src/components/editor/BaseTextEditor.vue";

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: useI18n().t("shared.dashboard.title"),
      path: "/dashboard",
    },
  ],
});

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    if (file.size > 1024 * 1024 * 128) {
      new MCSLNotif({
        data: {
          title: "文件大小超出限制",
          message: "请选择小于 128MB 的文件",
        },
      }).open();
      return;
    }
    const content = await file.arrayBuffer();
    const executableType = await getExecutableType(file.type, content);
    new MCSLNotif({
      data: {
        title: "核心检测结果",
        message: executableType,
      },
    }).open();
  }
}

const showEditor = ref(false);
const editorText = ref("");
</script>

<template>
  <div class="dashboard">
    <input type="file" @change="handleFileChange" />
    <Button type="primary" @click="showEditor = true">打开文本编辑器</Button>
    <Modal
      v-model:visible="showEditor"
      header="文本编辑器"
      max-width="80vw"
      :close-on-esc="false"
      :close-on-click-outside="false"
    >
      <BaseTextEditor class="editor" v-model="editorText" />
    </Modal>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
}
</style>

<style lang="scss">
.editor {
  width: 100%;
  height: calc(80vh - 2 * var(--mcsl-spacing-md));
}
</style>
