import { createRouter, createWebHistory } from "vue-router";
import { ref } from "vue";
import Home from "@repo/commons/src/pages/Home.vue";
import Welcome from "@repo/commons/src/pages/welcome/Welcome.vue";
import Eula from "@repo/commons/src/pages/welcome/Eula.vue";
import Done from "@repo/commons/src/pages/welcome/Done.vue";
import Debug from "@repo/commons/src/pages/Debug.vue";
import Instances from "@repo/commons/src/pages/Instances.vue";
import News from "@repo/commons/src/pages/News.vue";

export type LayoutType = "none" | "default";

export const layout = ref<LayoutType>("default");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: Home,
    },
    {
      path: "/welcome/welcome",
      component: Welcome,
      meta: {
        layout: "none",
      },
    },
    {
      path: "/welcome/eula",
      component: Eula,
      meta: {
        layout: "none",
      },
    },
    {
      path: "/welcome/done",
      component: Done,
      meta: {
        layout: "none",
      },
    },
    {
      path: "/debug",
      component: Debug,
    },
    {
      path: "/instances",
      component: Instances,
    },
    {
      path: "/news",
      component: News,
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  layout.value = <LayoutType | undefined>to.meta.layout ?? "default";

  next();
});

export default router;
