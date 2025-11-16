<script setup lang="ts">
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";
import Select from "@repo/ui/src/components/form/entries/Select.vue";
import { useLocalStorage } from "@vueuse/core";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import router from "../router.ts";
import { getGameType } from "../utils/node/instanceTypes.ts";
import { snakeToPascal } from "../utils/utils.ts";

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: useI18n().t("shared.instances.title"),
      path: "/instances",
    },
  ],
});

const t = useI18n().t;
const search = ref("");
const sorting = useLocalStorage("instance-sorting", {
  ascending: true,
  sorting: "name",
  grouping: "user",
});
const instances = ref([
  {
    daemon: "My Daemon 1",
    id: "test",
    name: "My Server 1",
    status: "running",
    type: "fabric",
    mcVersion: "1.20.1",
    loaderVersion: "0.16.14",
    lastRunAt: "2023-08-10T12:00:00Z",
    createdAt: "2023-08-01T08:00:00Z",
    updatedAt: "2023-08-10T12:00:00Z",
    grouping: "分组1",
  },
  {
    daemon: "My Daemon 2",
    id: "test2",
    name: "My Server 2",
    status: "stopped",
    type: "forge",
    mcVersion: "1.12.2",
    loaderVersion: "14.23.5.2860",
    lastRunAt: "2023-08-09T18:30:00Z",
    createdAt: "2023-08-02T10:00:00Z",
    updatedAt: "2023-08-09T18:30:00Z",
    grouping: "分组2",
  },
  {
    daemon: "My Daemon 1",
    id: "test2",
    name: "My Server 3",
    status: "starting",
    type: "terraria",
    loaderVersion: "1.4.4.9",
    lastRunAt: "2023-08-09T18:30:00Z",
    createdAt: "2023-08-02T10:00:00Z",
    updatedAt: "2023-08-09T18:30:00Z",
    grouping: "分组2",
  },
]);

function highlight(text: string) {
  if (search.value == "") return text;
  const regex = new RegExp(`(${search.value})`, "gi");
  return text.replace(regex, "<span class='highlight'>$1</span>");
}

function getTypeInfo(instance: any) {
  const game = getGameType(instance.type);
  if (game != "mc") return t(`shared.instances.types.${game}`);
  if (instance.type == "vanilla")
    return `${t(`shared.instances.types.vanilla`)} ${instance.mcVersion}`;
  else
    return `${snakeToPascal(instance.type).replaceAll("+", " +")} ${instance.mcVersion}`;
}

function getTypeTooltip(instance: any) {
  const game = getGameType(instance.type);
  if (game != "mc") return undefined;
  if (instance.type == "vanilla")
    return `${t(`shared.instances.types.vanilla`)} ${instance.mcVersion}`;
  else
    return `${snakeToPascal(instance.type).replaceAll("+", " +")} ${instance.mcVersion}`;
}
</script>

<template>
  <div>
    <div class="instances__searchbar">
      <InputText v-model="search" clean-btn placeholder="搜索实例..." />
      <div>
        <Select
          v-model="sorting.sorting"
          prefix="排序："
          :options="[
            { value: 'name', label: t('shared.instances.sorting.name') },
            { value: 'status', label: t('shared.instances.sorting.status') },
            { value: 'type', label: t('shared.instances.sorting.type') },
            { value: 'created', label: t('shared.instances.sorting.created') },
            { value: 'updated', label: t('shared.instances.sorting.updated') },
            { value: 'lastrun', label: t('shared.instances.sorting.lastrun') },
          ]"
        />
        <Select
          prefix="分组："
          v-model="sorting.grouping"
          :options="[
            {
              value: 'user',
              label: t('shared.instances.sorting.user-grouping'),
            },
            { value: 'node', label: t('shared.instances.sorting.node') },
            { value: 'type', label: t('shared.instances.sorting.type') },
            { value: 'none', label: t('shared.instances.sorting.no-grouping') },
          ]"
        />
      </div>
    </div>
    <div class="instances__instances">
      <Panel
        shadow="hover"
        v-for="instance in instances"
        :key="instance.id"
        @click.self="router.push(`/instance/${instance.id}`)"
      >
        <div class="instances__instance">
          <div>
            <!-- TODO: 图标 -->
            <i class="fa fa-server" />
            <div>
              <h3>{{ highlight(instance.name) }}</h3>
              <p v-tooltip="getTypeTooltip(instance)">
                <i class="fa fa-server" />{{ getTypeInfo(instance) }}
              </p>
              <p><i class="fa fa-desktop" />{{ instance.daemon }}</p>
            </div>
          </div>
          <Button @click.stop="console.log('awa')" />
        </div>
      </Panel>
    </div>
  </div>
</template>

<style scoped lang="scss">
.instances__searchbar {
  margin-bottom: var(--mcsl-spacing-md);
  &,
  & > div {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }

  @media (min-width: 769px) {
    & > div > div {
      width: 12rem;
      flex-grow: 0;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    & > div {
      width: 100%;
    }
  }

  @media (max-width: 425px) {
    & > div {
      flex-direction: column;
      & > div {
        width: 100%;
      }
    }
  }
}

.instances__instances {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--mcsl-spacing-2xs);
}

.instances__instance {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);

  & > div {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--mcsl-spacing-xs);

    & > i {
      width: 4rem;
      height: 4rem;
      background: var(--mcsl-bg-color-main);
      border-radius: var(--mcsl-border-radius-sm);
      border: 1px solid var(--mcsl-border-color-base);

      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2rem;
    }

    & > div {
      flex-grow: 1;
    }
  }
}
</style>
