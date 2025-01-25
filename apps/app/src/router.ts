import { createRouter, createWebHistory } from "vue-router";
import { ref } from "vue";

export type LayoutType = "none" | "default";

export const layout = ref<LayoutType>("default");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("@repo/commons/src/pages/Home.vue"),
    },
    {
      path: "/welcome/welcome",
      component: () => import("@repo/commons/src/pages/Welcome/Welcome.vue"),
      meta: {
        layout: "none",
      },
    },
    {
      path: "/welcome/eula",
      component: () => import("@repo/commons/src/pages/Welcome/Eula.vue"),
      meta: {
        layout: "none",
      },
    },
    {
      path: "/welcome/done",
      component: () => import("@repo/commons/src/pages/Welcome/Done.vue"),
      meta: {
        layout: "none",
      },
    },
    {
      path: "/debug",
      component: () => import("@repo/commons/src/pages/Debug.vue"),
    },
    {
      path: "/instances",
      component: () => import("@repo/commons/src/pages/Instances.vue"),
    },
    {
      path: "/news",
      component: () => import("@repo/commons/src/pages/News.vue"),
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  layout.value = <LayoutType | undefined>to.meta.layout ?? "default";

  next();
});

export default router;
