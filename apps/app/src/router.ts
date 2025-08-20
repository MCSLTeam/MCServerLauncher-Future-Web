import { createRouter, createWebHistory } from "vue-router";
import { ref } from "vue";

export type LayoutType = "none" | "default";

export const layout = ref<LayoutType>("default");

const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

router.beforeEach(async (to, _from, next) => {
  layout.value = <LayoutType | undefined>to.meta.layout ?? "default";

  next();
});

export default router;
