import { defineStore } from "pinia";
import type { BreadcrumbItem } from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import { computed, ref } from "vue";
import type { PageNavigationInfo } from "@repo/ui/src/utils/utils.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { useLocalStorage } from "@vueuse/core";
import { showCreateInstanceModal } from "../index.ts"; /* ========== [ 页面数据 ]========== */

/* ========== [ 页面数据 ]========== */
export type PageData = {
  layout: "dashboard" | "setup" | "none";
  breadcrumbs: BreadcrumbItem[];
};

export const usePageData = defineStore("pagaData", () => {
  const pageData = ref<PageData>({
    layout: "none",
    breadcrumbs: [],
  });

  function set(data: PageData) {
    pageData.value = data;
  }

  return {
    data: computed(() => pageData.value),
    set,
  };
});

/* ========== [ 页面导航 ]========== */
export type NavigationType =
  | "sidebarUpper"
  | "sidebarDowner"
  | "navbar"
  | "settings"
  | "instance";
export const useNavigation = defineStore("navigation", () => {
  const t = useLocale().getI18n().t;

  const items = ref<Record<NavigationType, PageNavigationInfo[]>>({
    sidebarUpper: [
      {
        label: t("shared.dashboard.title"),
        link: "/dashboard",
        icon: "fa fa-dashboard",
      },
      {
        label: t("shared.instances.title"),
        link: "/instances",
        icon: "fa fa-server",
        isSubpage: (path: string) => path.startsWith("/instance"),
      },
      {
        label: t("shared.resource-center.title"),
        link: "/resource-center",
        icon: "fa fa-puzzle-piece",
      },
      {
        label: t("shared.help-center.title"),
        link: "/help-center",
        icon: "fa fa-circle-info",
      },
    ],
    sidebarDowner: [
      {
        label: t("shared.create-instance.button"),
        icon: "fa fa-plus",
        onClick() {
          showCreateInstanceModal.value = true;
        },
      },
      {
        label: t("shared.nodes.title"),
        link: "/nodes",
        icon: "fa fa-desktop",
      },
      {
        label: t("shared.settings.title"),
        link: "/settings",
        icon: "fa fa-gear",
      },
    ],
    navbar: [
      {
        label: t("shared.tasks.title"),
        icon: "fa fa-list-check",
        onClick() {},
      },
    ],
    settings: [
      {
        label: t("shared.settings.general.title"),
        link: "/settings/general",
        icon: "fa fa-gears",
      },
      {
        label: t("shared.settings.appearance.title"),
        link: "/settings/appearance",
        icon: "fa fa-brush",
      },
      {
        label: t("shared.settings.instance-creation.title"),
        link: "/settings/instance-creation",
        icon: "fa fa-plus",
      },
      {
        label: t("shared.settings.instance-management.title"),
        link: "/settings/instance-management",
        icon: "fa fa-server",
      },
      {
        label: t("shared.settings.about.title"),
        link: "/settings/about",
        icon: "fa fa-circle-info",
      },
    ],
    instance: [
      {
        label: t("shared.instance.overview.title"),
        link: "./overview",
        isSubpage: (path) => /\/instance\/[a-zA-Z0-9-]+\/overview/.test(path),
        icon: "fa fa-chart-line",
      },
      {
        label: t("shared.instance.console.title"),
        link: "./console",
        isSubpage: (path) => /\/instance\/[a-zA-Z0-9-]+\/console/.test(path),
        icon: "fa fa-terminal",
      },
      {
        label: t("shared.instance.files.title"),
        link: "./files",
        isSubpage: (path) => /\/instance\/[a-zA-Z0-9-]+\/files/.test(path),
        icon: "fa fa-folder-open",
      },
      {
        label: t("shared.instance.automation.title"),
        link: "./automation",
        isSubpage: (path) => /\/instance\/[a-zA-Z0-9-]+\/automation/.test(path),
        icon: "fa fa-calendar",
      },
      {
        label: t("shared.instance.settings.title"),
        link: "./settings",
        isSubpage: (path) => /\/instance\/[a-zA-Z0-9-]+\/settings/.test(path),
        icon: "fa fa-gear",
      },
    ],
  });

  function addItem(
    type: NavigationType,
    item: PageNavigationInfo,
    index: number,
  ) {
    items.value[type].splice(index, 0, item);
  }

  function getItems(type: NavigationType) {
    return computed(() => items.value[type]);
  }

  return {
    getItems,
    addItem,
  };
});

/* ========== [ 设置 ]========== */
export const useSettings = defineStore("settings", () => {
  const settings = useLocalStorage("settings", {
    allowContextmenu: false,
    useTerminalInput: false,
  });

  function load() {
    document.body.addEventListener("contextmenu", (e) => {
      if (!settings.value.allowContextmenu) {
        e.preventDefault();
      }
    });
  }

  return {
    data: settings,
    load,
  };
});
