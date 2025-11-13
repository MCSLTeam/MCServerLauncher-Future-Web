import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      component: async () => await import("./views/Settings.vue"),
    },
  ],
});

export default router;
