import { defineStore } from "pinia";
import type { BreadcrumbItem } from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import { computed, ref } from "vue";
import type { PageNavigationInfo } from "@repo/ui/src/utils/utils.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";

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
export const useNavigation = defineStore("navigation", () => {
  const t = useLocale().getI18n().t;

  const sidebarUpperItems = ref<PageNavigationInfo[]>([
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
  ]);

  const sidebarDownerItems = ref<PageNavigationInfo[]>([
    {
      label: t("shared.tasks.title"),
      icon: "fa fa-list-check",
      onClick() {},
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
  ]);

  const navbarItems = ref<PageNavigationInfo[]>([
    {
      label: t("shared.navbar.notifications"),
      icon: "fa fa-bell",
      onClick() {},
    },
  ]);

  function addSidebarUpperItem(item: PageNavigationInfo, index: number) {
    sidebarUpperItems.value.splice(index, 0, item);
  }

  function addSidebarDownerItem(item: PageNavigationInfo, index: number) {
    sidebarDownerItems.value.splice(index, 0, item);
  }

  function addNavbarItem(item: PageNavigationInfo, index: number) {
    navbarItems.value.splice(index, 0, item);
  }

  return {
    sidebarUpperItems: computed(() => sidebarUpperItems.value),
    sidebarDownerItems: computed(() => sidebarDownerItems.value),
    navbarItems: computed(() => navbarItems.value),
    addSidebarUpperItem,
    addSidebarDownerItem,
    addNavbarItem,
  };
});
