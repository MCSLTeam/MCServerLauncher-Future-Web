<script setup lang="ts">
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";
import Select from "@repo/ui/src/components/form/entries/Select.vue";
import { useLocalStorage } from "@vueuse/core";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import { computed, ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Contextmenu from "@repo/ui/src/components/overlay/Contextmenu.vue";
import { type MenuItem } from "@repo/ui/src/components/panel/Menu.vue";
import router from "../router.ts";
import { snakeToPascal } from "../utils/utils.ts";
import { pinyin } from "pinyin-pro";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import type { InstanceStatus } from "../utils/node/types/instance.ts";
import { getGame } from "../utils/node/types/cores.ts";

const t = useI18n().t;

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: t("shared.instances.title"),
      path: "/instances",
    },
  ],
});

const search = ref("");
const sorting = useLocalStorage("instance-sorting", {
  ascending: true,
  sorting: "name",
  grouping: "user",
});
const noGrouping = computed(
  () =>
    sorting.value.grouping != "user" &&
    sorting.value.grouping != "node" &&
    sorting.value.grouping != "type",
);
const statusPriority: Record<InstanceStatus, number> = {
  running: 1,
  crashed: 2,
  installing: 3,
  starting: 4,
  stopping: 5,
  stopped: 6,
};
const instances = ref<Record<string, any[]>>({
  "My Daemon 1": [
    {
      id: "test",
      icon: "",
      name: "My Server 1",
      status: "running",
      type: "vanilla",
      gameVersion: "1.20.1",
      loaderVersion: "1.20.1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
      grouping: "分组1",
    },
    {
      id: "test3",
      icon: "",
      name: "名称很长很长很长很长很长",
      status: "starting" as InstanceStatus,
      type: "tshock",
      gameVersion: "1.4.4.9",
      loaderVersion: "6.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
      grouping: "分组2",
    },
  ],
  "My Daemon 2": [
    {
      id: "test2",
      icon: "",
      name: "My Server 2",
      status: "stopped" as InstanceStatus,
      type: "forge",
      gameVersion: "1.12.2",
      loaderVersion: "14.23.5.2860",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
    },
  ],
});

function getStatusColor(status: InstanceStatus) {
  switch (status) {
    case "running":
      return "green";
    case "stopped":
      return "gray";
    case "starting":
      return "emerald";
    case "stopping":
      return "orange";
    case "crashed":
      return "red";
    case "installing":
      return "blue";
  }
}

function shouldStatusRipple(status: InstanceStatus) {
  return (
    status === "installing" ||
    status === "starting" ||
    status === "running" ||
    status === "stopping"
  );
}

function matchWithPinyin(text: string, searchText: string): boolean {
  // 直接文本匹配
  if (text.toLowerCase().replaceAll(/\s+/g, "").includes(searchText)) {
    return true;
  }

  // 全拼音匹配
  const fullPinyin = pinyin(text, {
    toneType: "none",
    type: "array",
  }).join("");
  if (fullPinyin.toLowerCase().includes(searchText)) {
    return true;
  }

  // 拼音首字母匹配
  const initialsPinyin = pinyin(text, {
    toneType: "none",
    pattern: "first",
    type: "array",
  }).join("");

  return initialsPinyin.toLowerCase().includes(searchText);
}

const sortedInstances = computed(() => {
  const allInstances = Object.entries(instances.value).flatMap(
    ([daemon, instances]) =>
      instances.map((instance) => ({ ...instance, daemon })),
  );

  let filtered = allInstances;
  if (search.value) {
    const searchText = search.value.toLowerCase().replaceAll(/\s+/g, "");

    filtered = allInstances.filter((instance) => {
      const tooltip = getTypeTooltip(instance);
      return (
        matchWithPinyin(instance.name, searchText) ||
        matchWithPinyin(getTypeInfo(instance), searchText) ||
        (tooltip != undefined && matchWithPinyin(tooltip, searchText)) ||
        matchWithPinyin(instance.daemon, searchText)
      );
    });
  }
  const grouped: Record<string, typeof allInstances> = {};

  if (noGrouping.value) {
    grouped[""] = filtered;
  } else {
    filtered.forEach((instance) => {
      let group = t("shared.instances.sorting.no-group");
      switch (sorting.value.grouping) {
        case "user": {
          group = instance.grouping ?? group;
          break;
        }
        case "node": {
          group = instance.daemon;
          break;
        }
        case "type": {
          group = getTypeInfo(instance);
          break;
        }
      }
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group]!.push(instance);
    });
  }

  // 对每个分组内的实例进行排序
  for (const group in grouped) {
    grouped[group]!.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sorting.value.sorting) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = statusPriority[a.status as InstanceStatus];
          bValue = statusPriority[b.status as InstanceStatus];
          break;
        case "type":
          aValue = getTypeInfo(a).toLowerCase();
          bValue = getTypeInfo(b).toLowerCase();
          break;
        case "created":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updated":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "lastrun":
          aValue = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
          bValue = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // 处理日期排序（最新的在前）
      if (
        sorting.value.sorting === "created" ||
        sorting.value.sorting === "updated" ||
        sorting.value.sorting === "lastrun"
      ) {
        return sorting.value.ascending ? bValue - aValue : aValue - bValue;
      }

      // 处理其他排序
      if (aValue < bValue) {
        return sorting.value.ascending ? -1 : 1;
      }
      if (aValue > bValue) {
        return sorting.value.ascending ? 1 : -1;
      }
      return 0;
    });
  }

  return grouped;
});

function getTypeInfo(instance: any) {
  const game = getGame(instance.type);
  if (
    (game == "mc" && instance.type != "vanilla") ||
    (game == "terraria" && instance.type != "terraria")
  )
    return `${snakeToPascal(instance.type).replaceAll("+", " +")} ${instance.gameVersion}`;
  return `${t(`shared.instances.types.${game}`)} ${instance.loaderVersion}`;
}

function getTypeTooltip(instance: any) {
  const game = getGame(instance.type);
  if (instance.gameVersion != instance.loaderVersion)
    return `${t(`shared.instances.types.${game}`)} ${instance.gameVersion} - ${snakeToPascal(instance.type).replaceAll("+", " +")} ${instance.loaderVersion}`;
  return undefined;
}

// 高亮搜索文本的函数
function highlightText(text: string, searchText: string): string {
  if (!searchText || !text) return text;

  const searchLower = searchText.toLowerCase().replaceAll(/\s+/g, "");
  const textLower = text.toLowerCase().replaceAll(/\s+/g, "");

  if (textLower.includes(searchLower)) {
    const regex = new RegExp(
      `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    return text.replace(
      regex,
      '<span class="instances__search-highlight">$1</span>',
    );
  }

  // 拼音的话全部高亮得了
  const fullPinyin = pinyin(text, {
    toneType: "none",
    type: "array",
  }).join("");

  if (fullPinyin.toLowerCase().includes(searchLower)) {
    return `<span class="instances__search-highlight">${text}</span>`;
  }

  const initialsPinyin = pinyin(text, {
    toneType: "none",
    pattern: "first",
    type: "array",
  }).join("");

  if (initialsPinyin.toLowerCase().includes(searchLower)) {
    return `<span class="instances__search-highlight">${text}</span>`;
  }

  return text;
}

function buildContextmenu(instance: any) {
  if ((instance.status as InstanceStatus) == "installing") return undefined;
  const menuInfo: MenuItem[] = [];
  switch (instance.status) {
    case "stopped":
    case "crashed":
      menuInfo.push({
        color: "emerald",
        icon: "fa fa-play",
        label: t("shared.instance.action.start"),
        onClick: () => {},
      });
      break;
    case "starting":
    case "running":
      menuInfo.push({
        color: "orange",
        icon: "fa fa-rotate-right",
        label: t("shared.instance.action.restart"),
        onClick: () => {},
      });
      menuInfo.push({
        color: "rose",
        icon: "fa fa-stop",
        label: t("shared.instance.action.stop"),
        onClick: () => {},
      });
    // @eslint-disable-next-line no-fallthrough
    case "stopping":
      menuInfo.push({
        color: "red",
        icon: "fa fa-power-off",
        label: t("shared.instance.action.kill"),
        onClick: () => {},
      });
      break;
  }
  return menuInfo;
}
</script>

<template>
  <div class="instances">
    <div class="instances__searchbar">
      <InputText
        v-model="search"
        clear-btn
        :placeholder="t('shared.instances.sorting.search-placeholder')"
      />
      <div>
        <div>
          <Button
            rounded
            @click="sorting.ascending = !sorting.ascending"
            :icon="
              sorting.ascending
                ? 'fa fa-sort-alpha-down'
                : 'fa fa-sort-alpha-down-alt'
            "
            v-tooltip="
              sorting.ascending
                ? t('ui.common.ascending')
                : t('ui.common.descending')
            "
          />
          <Select
            v-model="sorting.sorting"
            :prefix="t('shared.instances.sorting.sorting')"
            :options="[
              {
                value: 'name',
                label: t('shared.instances.sorting.methods.name'),
              },
              {
                value: 'status',
                label: t('shared.instances.sorting.methods.status'),
              },
              {
                value: 'type',
                label: t('shared.instances.sorting.methods.type'),
              },
              {
                value: 'created',
                label: t('shared.instances.sorting.methods.created'),
              },
              {
                value: 'updated',
                label: t('shared.instances.sorting.methods.updated'),
              },
              {
                value: 'lastrun',
                label: t('shared.instances.sorting.methods.lastrun'),
              },
            ]"
          />
        </div>
        <Select
          :prefix="t('shared.instances.sorting.grouping')"
          v-model="sorting.grouping"
          :options="[
            {
              value: 'user',
              label: t('shared.instances.sorting.methods.user-grouping'),
            },
            {
              value: 'node',
              label: t('shared.instances.sorting.methods.node'),
            },
            {
              value: 'type',
              label: t('shared.instances.sorting.methods.type'),
            },
            {
              value: 'none',
              label: t('shared.instances.sorting.methods.no-grouping'),
            },
          ]"
        />
      </div>
    </div>
    <div class="instances__content">
      <div v-for="(instances, group) in sortedInstances" :key="group">
        <Divider
          v-if="!noGrouping"
          spacing="md"
          text-pos="start"
          bg-color="var(--mcsl-bg-color-main)"
        >
          <span v-html="highlightText(group, search)" />
        </Divider>
        <div class="instances__instances">
          <Panel
            class="instances__instance"
            shadow="hover"
            v-for="instance in instances"
            :key="instance.id"
            tabindex="0"
            @click="router.push(`/instance/${instance.id}`)"
            @keydown.enter="router.push(`/instance/${instance.id}`)"
          >
            <template #contextmenu>
              <Contextmenu
                v-if="buildContextmenu(instance)"
                :menu="buildContextmenu(instance)!"
              />
            </template>
            <div class="instances__instance-info">
              <!-- TODO: 图标 -->
              <img src="../assets/img/MCSL.png" alt="" />
              <div>
                <h3 v-html="highlightText(instance.name, search)" />
                <p>
                  <i class="fa fa-server" />
                  <span v-html="highlightText(getTypeInfo(instance), search)" />
                  <i
                    class="far fa-question-circle"
                    v-if="getTypeTooltip(instance) != undefined"
                    v-tooltip="getTypeTooltip(instance)"
                  />
                </p>
                <p>
                  <i class="fa fa-desktop" />
                  <span v-html="highlightText(instance.daemon, search)" />
                </p>
              </div>
            </div>
            <i
              class="instances__instance-status"
              :class="{
                'instances__instance-status-ripple': shouldStatusRipple(
                  instance.status,
                ),
              }"
              :style="{
                '--instances__instance-status-color': `var(--mcsl-color-${getStatusColor(instance.status)}-400)`,
              }"
              v-tooltip="t(`shared.instances.status.${instance.status}`)"
            />
          </Panel>
        </div>
      </div>

      <div
        v-if="Object.keys(sortedInstances).length == 0 && search"
        class="instances__search-empty"
      >
        {{ t("shared.instances.sorting.search-empty") }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.instances {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-md);
}

.instances__content {
  height: 0;
  flex-grow: 1;
  overflow: hidden auto;
}

.instances__searchbar {
  &,
  & > div,
  & > div > div:first-child {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }

  @media (min-width: 769px) {
    & .mcsl-select {
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
    & > div > div:first-child {
      flex-grow: 1;
    }
  }

  @media (max-width: 450px) {
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
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: var(--mcsl-spacing-2xs);

  & > * {
    cursor: pointer;
  }
}

.instances__instance {
  transform: translate(0);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transition: 0.2s ease-in-out;

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}

.instances__instance-info {
  width: 100%;
  display: flex;
  gap: var(--mcsl-spacing-lg);

  & > img {
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
    width: calc(100% - 4rem - var(--mcsl-spacing-lg));

    & > h3 {
      margin-bottom: var(--mcsl-spacing-4xs);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      transition: 0.2s ease-in-out;
    }

    & > p {
      & > i {
        margin-right: var(--mcsl-spacing-4xs);
      }

      & > i.fa-question-circle {
        cursor: help;
        margin-left: var(--mcsl-spacing-4xs);
        color: var(--mcsl-text-color-gray);
      }
    }
  }
}

.instances__instance-status {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  cursor: help;
  padding: var(--mcsl-spacing-xs);
}

.instances__instance-status::after {
  content: "";
  display: flex;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--instances__instance-status-color);
  border-radius: var(--mcsl-border-radius-full);
}

.instances__instance-status-ripple::before {
  position: absolute;
  content: "";
  display: flex;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--instances__instance-status-color);
  border-radius: var(--mcsl-border-radius-full);
  animation: instances__instance-status-ripple 1s ease-in-out infinite;
}

@keyframes instances__instance-status-ripple {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.75);
    opacity: 0;
  }
}

.instances__search-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--mcsl-spacing-xl);
  color: var(--mcsl-text-color-gray);
  font-size: var(--mcsl-font-size-lg);
}
</style>

<style lang="scss">
.instances__search-highlight {
  background: var(--mcsl-color-primary-100);
}
</style>
