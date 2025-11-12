import { createRouter, createWebHistory } from "vue-router";
import { readonly, ref } from "vue";

export type LayoutType = "none" | "default";

const _layout = ref<LayoutType>("default");

export const layout = readonly(_layout);

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Dashboard",
      component: async () => await import("./views/Dashboard.vue"),
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  _layout.value = <LayoutType | undefined>to.meta.layout ?? "default";

  next();
});

export default router;
