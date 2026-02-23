<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Message from "../misc/Message.vue";
import { humanReadableSize } from "../../utils/utils.ts";
import Button from "../button/Button.vue";

const t = useI18n().t;

const files = defineModel<File[]>({
  required: false,
  default: [],
});
</script>

<template>
  <div class="mcsl-file-info" v-if="files.length > 0">
    <h5>{{ t("ui.upload.list.title") }}</h5>
    <Message
      v-for="file in files"
      :key="file.name + file.lastModified"
      icon="fa fa-link"
      closeable
      color="surface"
      variant="text"
      @closed="files = files.filter((f) => f != file)"
      @click.stop=""
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
      <p class="mcsl-file-info__text">
        <strong>{{ file.name }}</strong>
        - {{ humanReadableSize(file.size) }}
      </p>
    </Message>
  </div>
</template>

<style scoped lang="scss">
.mcsl-file-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-4xs);
  cursor: auto;

  & > h5 {
    color: var(--mcsl-text-color-regular);
  }
}

.mcsl-file-info__text {
  width: calc(100% - 15px - var(--mcsl-spacing-4xs));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
