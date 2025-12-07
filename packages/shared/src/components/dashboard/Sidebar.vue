<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import {
  getPlatform,
  version,
  versionCodename,
  windowButtonsExists,
  windowButtonTransition,
} from "../../index.ts";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useScreenWidth } from "@repo/ui/src/utils/stores.ts";

const props = defineProps<{
  collapsed: boolean;
  expanded: boolean;
}>();

const t = useI18n().t;
const platform = getPlatform();
const router = useRouter();
const currentPath = computed(() => router.currentRoute.value.fullPath);
const screenWidth = useScreenWidth();
const sidebarCollapsed = computed(
  () => props.collapsed && !props.expanded && screenWidth.width != "xs",
);
</script>

<template>
  <div
    class="sidebar"
    :class="{
      sidebar__collapsed: sidebarCollapsed,
      sidebar__expanded: expanded,
    }"
  >
    <div
      data-tauri-drag-region
      class="logo"
      :class="[`logo-${platform}`]"
      :style="{
        paddingTop: windowButtonsExists
          ? `calc(var(--mcsl-spacing-xs) + 2 * var(--mcsl-spacing-md) + 1rem)`
          : `var(--mcsl-spacing-xl)`,
        transition: `padding-top ${windowButtonTransition}`,
      }"
    >
      <img
        src="../../assets/MCSL.png"
        alt=""
        width="35"
        v-tooltip.right="
          collapsed
            ? `$${t('shared.app.name.abbr')} ${t('shared.app.name.future')} ${t(`${platform}.app.name.suffix`)} (${versionCodename} v${version})`
            : undefined
        "
      />
      <div v-if="!sidebarCollapsed">
        <h2>
          <span>
            {{ t("shared.app.name.abbr") }}
            {{ t("shared.app.name.future") }}
          </span>
          <span>&nbsp;{{ t(`${platform}.app.name.suffix`) }}</span>
        </h2>
        <p v-tooltip.bottom="`v${version}`">{{ versionCodename }}</p>
      </div>
    </div>
    <Divider spacing="md" />
    <div class="sidebar__content-big">
      <div>
        <Button
          :class="{ 'sidebar__btn-selected': currentPath == '/dashboard' }"
          icon="fa fa-dashboard"
          block
          type="text"
          align="left"
          :color="currentPath == '/dashboard' ? 'primary' : undefined"
          :size="sidebarCollapsed ? 'large' : 'middle'"
          v-tooltip.right="
            sidebarCollapsed ? t('shared.dashboard.title') : undefined
          "
          @click="router.push('/dashboard')"
        >
          <template v-if="!sidebarCollapsed">{{
            t("shared.dashboard.title")
          }}</template>
        </Button>
        <Button
          :class="{
            'sidebar__btn-selected': currentPath.startsWith('/instances'),
          }"
          icon="fa fa-server"
          block
          type="text"
          align="left"
          :color="currentPath.startsWith('/instances') ? 'primary' : undefined"
          :size="sidebarCollapsed ? 'large' : 'middle'"
          v-tooltip.right="
            sidebarCollapsed ? t('shared.instances.title') : undefined
          "
          @click="router.push('/instances')"
        >
          <template v-if="!sidebarCollapsed">{{
            t("shared.instances.title")
          }}</template>
        </Button>
        <Button
          :class="{
            'sidebar__btn-selected': currentPath.startsWith('/resource-center'),
          }"
          icon="fa fa-puzzle-piece"
          block
          type="text"
          align="left"
          :size="sidebarCollapsed ? 'large' : 'middle'"
          :color="
            currentPath.startsWith('/resource-center') ? 'primary' : undefined
          "
          v-tooltip.right="
            sidebarCollapsed ? t('shared.resource-center.title') : undefined
          "
          @click="router.push('/resource-center')"
        >
          <template v-if="!sidebarCollapsed">{{
            t("shared.resource-center.title")
          }}</template>
        </Button>
        <Button
          :class="{
            'sidebar__btn-selected': currentPath.startsWith('/help-center'),
          }"
          icon="fa fa-circle-info"
          block
          type="text"
          align="left"
          :color="
            currentPath.startsWith('/help-center') ? 'primary' : undefined
          "
          :size="sidebarCollapsed ? 'large' : 'middle'"
          v-tooltip.right="
            sidebarCollapsed ? t('shared.help-center.title') : undefined
          "
          @click="router.push('/help-center')"
        >
          <template v-if="!sidebarCollapsed">{{
            t("shared.help-center.title")
          }}</template>
        </Button>
      </div>
      <div class="sidebar__content">
        <div>
          <Divider spacing="md" />
          <Button
            icon="fa fa-list-check"
            block
            type="text"
            align="left"
            :size="sidebarCollapsed ? 'large' : 'middle'"
            v-tooltip.right="
              sidebarCollapsed ? t('shared.tasks.title') : undefined
            "
          >
            <template v-if="!sidebarCollapsed">{{
              t("shared.tasks.title")
            }}</template>
          </Button>
          <Button
            :class="{ 'sidebar__btn-selected': currentPath == '/nodes' }"
            icon="fa fa-desktop"
            block
            type="text"
            align="left"
            :size="sidebarCollapsed ? 'large' : 'middle'"
            v-tooltip.right="
              sidebarCollapsed ? t('shared.nodes.title') : undefined
            "
            :color="currentPath == '/nodes' ? 'primary' : undefined"
            @click="router.push('/nodes')"
          >
            <template v-if="!sidebarCollapsed">{{
              t("shared.nodes.title")
            }}</template>
          </Button>
          <Button
            :class="{ 'sidebar__btn-selected': currentPath == '/settings' }"
            icon="fa fa-cog"
            block
            type="text"
            align="left"
            :size="sidebarCollapsed ? 'large' : 'middle'"
            v-tooltip.right="
              sidebarCollapsed ? t('shared.settings.title') : undefined
            "
            :color="currentPath == '/settings' ? 'primary' : undefined"
            @click="router.push('/settings')"
          >
            <template v-if="!sidebarCollapsed">{{
              t("shared.settings.title")
            }}</template>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@repo/ui/src/assets/css/utils";
@use "@repo/ui/src/components/SmallerContent";

$collapsed-width: utils.get-size-var("height", "large", SmallerContent.$vars);

.sidebar {
  $width: 16rem;
  $padding: var(--mcsl-spacing-md);
  position: absolute;
  top: 0;
  left: 0;
  padding: var(--mcsl-spacing-md);
  padding-top: 0;
  width: $width;
  height: calc(100% - $padding);
  border-radius: 0 var(--mcsl-border-radius-xl) var(--mcsl-border-radius-xl) 0;
  background: var(--mcsl-bg-color-overlay);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;
  transition: 0.3s ease-in-out;

  @media (max-width: 425px) {
    left: calc(0px - $width - 2 * $padding);
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);

  & > img {
    width: $collapsed-width;

    .sidebar__collapsed & {
      cursor: help;
    }
  }

  & > div {
    display: flex;
    flex-direction: column;
    justify-content: center;

    & > h2 {
      font-size: var(--mcsl-font-size-lg);
      font-weight: var(--mcsl-font-weight-bold);

      & > span:first-child {
        color: transparent;
        background: linear-gradient(
          45deg,
          var(--mcsl-color-green),
          var(--mcsl-color-blue)
        );
        background-clip: text;
      }

      & > span:last-child {
        color: transparent;
        background: linear-gradient(
          135deg,
          var(--suffix-color-1),
          var(--suffix-color-2)
        );
        background-clip: text;
      }
    }

    & > p {
      width: fit-content;
      color: var(--mcsl-text-color-gray);
      font-size: var(--mcsl-font-size-sm);
      cursor: help;
    }
  }
}

.sidebar__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: var(--mcsl-spacing-4xs);

  & > div {
    width: 100%;
  }
}

.logo-web {
  --suffix-color-1: var(--mcsl-color-sky);
  --suffix-color-2: var(--mcsl-color-blue-600);
}

.logo-app {
  --suffix-color-1: var(--mcsl-color-amber-400);
  --suffix-color-2: var(--mcsl-color-red);
}

.sidebar__content-big {
  @extend .sidebar__content;
  flex-grow: 1;
}

.sidebar__collapsed {
  width: $collapsed-width;
}

.sidebar__expanded {
  box-shadow: var(--mcsl-box-shadow-darker);
  left: 0;
}

.sidebar__btn-selected {
  background: utils.transparent(var(--mcsl-color-primary), 10%);
}
</style>

<style lang="scss">
.sidebar__collapsed button > i {
  font-size: var(--mcsl-font-size-lg);
}
</style>
