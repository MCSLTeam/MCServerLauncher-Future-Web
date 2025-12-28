import { defineStore } from "pinia";
import type { BreadcrumbItem } from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import { computed, ref } from "vue";

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