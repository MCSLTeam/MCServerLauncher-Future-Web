import "../assets/css/style.css";
import "../assets/css/fontawesome.min.css";
import "animate.css";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { type Router, useRouter } from "vue-router";

export let beian: string | undefined;

export let router: Router = useRouter();

export function setBeian(b: string) {
  beian = b;
}

export function setRouter(r: Router) {
  router = r;
}
