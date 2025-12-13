/// <reference types="@rsbuild/core/types" />
/// <reference types="rsbuild-plugin-svg" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, any>;
  export default component;
}
