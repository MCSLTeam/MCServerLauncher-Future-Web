<script setup lang="ts">
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import { ref } from "vue";
import type { JavaInfo } from "../../../utils/node/types/system.ts";
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/button/Button.vue";
import Tag from "@repo/ui/src/components/misc/tag/Tag.vue";

const t = useI18n().t;

const javaPath = defineModel<string>({
  required: true,
});

const visible = defineModel<boolean>("visible", {
  required: true,
});

const searchedJavas = ref<JavaInfo[]>([
  {
    type: "jdk",
    path: "/usr/lib/jvm/somewhere/somewhere/somewhere/somewhere/somewhere/somewhere/java",
    version: "1.8.0_362",
    arch: "x86_64",
    vendor: "Oracle Corporation",
  },
  {
    type: "jre",
    path: "/usr/lib/jvm/somewhere/java",
    version: "1.8.0_362",
    arch: "aarch64",
    vendor: "Oracle Corporation",
  },
]);
</script>

<template>
  <!-- TODO: i18n -->
  <Modal :visible="visible" :header="t('shared.java-search.title')">
    <div v-if="searchedJavas">
      <table>
        <thead>
          <tr>
            <th>{{ t("shared.java-search.type") }}</th>
            <th>{{ t("shared.java-search.path") }}</th>
            <th>{{ t("shared.java-search.version") }}</th>
            <th>{{ t("shared.java-search.arch") }}</th>
            <th>{{ t("shared.java-search.vendor") }}</th>
            <th>{{ t("ui.common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="java in searchedJavas" :key="java.path">
            <td>
              <Tag :color="java.type == 'jdk' ? 'primary' : 'teal'">
                {{ java.type.toUpperCase() }}
              </Tag>
            </td>
            <td v-tooltip="java.path" class="java-search__path">
              {{ java.path }}
            </td>
            <td>{{ java.version }}</td>
            <td>{{ java.arch }}</td>
            <td class="java-search__vendor" v-tooltip="java.vendor">
              {{ java.vendor }}
            </td>
            <td>
              <Button
                icon="fa-solid fa-check"
                color="primary"
                rounded
                size="small"
                v-tooltip="t('ui.common.select')"
                @click="
                  () => {
                    javaPath = java.path;
                    visible = false;
                  }
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Spinner v-else block />
  </Modal>
</template>

<style scoped lang="scss">
.java-search__path {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;

  @media (max-width: 768px) {
    max-width: 50px;
  }
}

.java-search__vendor {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;

  @media (max-width: 450px) {
    max-width: 20px;
  }
}
</style>
