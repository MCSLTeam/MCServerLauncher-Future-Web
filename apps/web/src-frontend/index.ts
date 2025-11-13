import { load } from "@repo/shared/src";
import App from "@repo/shared/src/App.vue";

(async () => {
  await load("web", App);
})();
