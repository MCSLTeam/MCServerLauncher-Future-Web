<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import Sidebar from "@repo/ui/src/components/navigation/Sidebar.vue";
import {
  getPlatform,
  version,
  versionCodename,
  windowButtonsExists,
  windowButtonTransition,
} from "../../index.ts";
import { computed } from "vue";
import { useScreenWidth } from "@repo/ui/src/utils/stores.ts";
import { useNavigation } from "../../utils/stores.ts";

const props = defineProps<{
  collapsed: boolean;
  expanded: boolean;
}>();

const t = useI18n().t;
const platform = getPlatform();
const screenWidth = useScreenWidth();
const sidebarCollapsed = computed(
  () => props.collapsed && !props.expanded && screenWidth.width != "xs",
);

const navigationInfo = useNavigation();
</script>

<template>
  <div
    class="dashboard-sidebar"
    :class="{
      'dashboard-sidebar__collapsed': sidebarCollapsed,
      'dashboard-sidebar__expanded': expanded,
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
    <div class="dashboard-sidebar__content-grow">
      <Sidebar
        :pages="navigationInfo.sidebarUpperItems"
        :size="collapsed ? 'large' : 'medium'"
        :collapsed="collapsed"
      />
      <div class="dashboard-sidebar__content">
        <Divider spacing="md" />
        <Sidebar
          :pages="navigationInfo.sidebarDownerItems"
          :size="collapsed ? 'large' : 'medium'"
          :collapsed="collapsed"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@repo/ui/src/assets/css/utils";
@use "@repo/ui/src/components/SmallerContent";

$collapsed-width: utils.get-size-var("height", "large", SmallerContent.$vars);

.dashboard-sidebar {
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
  overflow: auto;
  z-index: 10;
  transition: 0.3s ease-in-out;

  @media (max-width: 450px) {
    left: calc(0px - $width - 2 * $padding);
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);

  & > img {
    width: $collapsed-width;

    .dashboard-sidebar__collapsed & {
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

.dashboard-sidebar__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: var(--mcsl-spacing-4xs);
}

.logo-web {
  --suffix-color-1: var(--mcsl-color-sky);
  --suffix-color-2: var(--mcsl-color-blue-600);
}

.logo-app {
  --suffix-color-1: var(--mcsl-color-amber-400);
  --suffix-color-2: var(--mcsl-color-red);
}

.dashboard-sidebar__content-grow {
  @extend .dashboard-sidebar__content;
  flex-grow: 1;
}

.dashboard-sidebar__collapsed {
  width: $collapsed-width;
}

.dashboard-sidebar__expanded {
  box-shadow: var(--mcsl-box-shadow-darker);
  left: 0;
}

.dashboard-sidebar__btn-selected {
  background: utils.transparent(var(--mcsl-color-primary), 10%);
}
</style>

<style lang="scss">
.dashboard-sidebar__collapsed button > i {
  font-size: var(--mcsl-font-size-lg);
}
</style>
