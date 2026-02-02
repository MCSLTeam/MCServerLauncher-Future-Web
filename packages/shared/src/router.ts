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
      path: "/instance/:instanceId",
      name: "Instance",
      component: async () => await import("./views/instance/Instance.vue"),
      redirect: (to) => {
        return `/instance/${to.params.instanceId}/overview`;
      },

      children: [
        {
          path: "/instance/:instanceId/overview",
          name: "Instance - Overview",
          component: async () => await import("./views/instance/Overview.vue"),
        },
        {
          path: "/instance/:instanceId/console",
          name: "Instance - Console",
          component: async () => await import("./views/instance/Console.vue"),
        },
        {
          path: "/instance/:instanceId/files",
          name: "Instance - Files",
          component: async () => await import("./views/instance/Files.vue"),
        },
        {
          path: "/instance/:instanceId/automation",
          name: "Instance - Automation",
          component: async () =>
            await import("./views/instance/Automation.vue"),
        },
        {
          path: "/instance/:instanceId/settings",
          name: "Instance - Settings",
          component: async () => await import("./views/instance/Settings.vue"),
        },
      ],
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
          path: "/settings/instance-creation",
          name: "Settings - Instance Creation",
          component: async () =>
            await import("./views/settings/InstanceCreation.vue"),
        },
        {
          path: "/settings/instance-management",
          name: "Settings - Instance Management",
          component: async () =>
            await import("./views/settings/InstanceManagement.vue"),
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
