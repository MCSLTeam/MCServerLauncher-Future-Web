import { createRouter, createWebHistory } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/welcome",
      name: "Welcome",
      redirect: "/welcome/setup",
    },
    {
      path: "/welcome/setup",
      name: "Welcome - Setup",
      component: async () => await import("./views/welcome/Setup.vue"),
    },
    {
      path: "/welcome/eula",
      name: "Welcome - EULA",
      component: async () => await import("./views/welcome/Eula.vue"),
    },
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: async () => await import("./views/Dashboard.vue"),
    },
    {
      path: "/instances",
      name: "Instances",
      component: async () => await import("./views/Instances.vue"),
    },
    {
      path: "/resource-center",
      name: "Resource Center",
      component: async () => await import("./views/ResourceCenter.vue"),
    },
    {
      path: "/help-center",
      name: "Help Center",
      component: async () => await import("./views/HelpCenter.vue"),
    },
    {
      path: "/nodes",
      name: "Nodes",
      component: async () => await import("./views/Nodes.vue"),
    },
    {
      path: "/settings",
      name: "Settings",
      component: async () => await import("./views/settings/Settings.vue"),
      redirect: "/settings/general",
      children: [
        {
          path: "/settings/general",
          name: "Settings - General",
          component: async () => await import("./views/settings/General.vue"),
        },
        {
          path: "/settings/appearance",
          name: "Settings - Appearance",
          component: async () =>
            await import("./views/settings/Appearance.vue"),
        },
        {
          path: "/settings/instance",
          name: "Settings - Instance",
          component: async () => await import("./views/settings/Instance.vue"),
        },
        {
          path: "/settings/about",
          name: "Settings - About",
          component: async () => await import("./views/settings/About.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "404",
      component: async () => await import("./views/NotFound.vue"),
    },
  ],
});

export const firstLoad = useLocalStorage("first-load", true);

router.beforeEach((to, _from, next) => {
  if (firstLoad.value) {
    if (!to.path.startsWith("/welcome")) next("/welcome");
  } else {
    if (to.path.startsWith("/welcome")) next("/");
  }

  next();
});

export default router;
