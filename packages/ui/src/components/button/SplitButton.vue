<script lang="ts" setup>
import type { ColorType } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";
import Button from "./Button.vue";
import DropdownMenu from "../overlay/DropdownMenu.vue";
import type { MenuInfo } from "../panel/Menu.vue";

defineOptions({
  inheritAttrs: false,
});

withDefaults(
  defineProps<{
    dropdownMenu: MenuInfo;
    dropdownIcon?: (defaultPos: "top" | "bottom") => string;
    dropdownLoad?: boolean;
    dropdownDefaultPos?: "top" | "bottom";
    disabled?: boolean;
    icon?: string;
    iconPos?: "left" | "right";
    loading?: boolean;
    loadingIcon?: string;
    loadingIconPos?: "left" | "right" | "same";
    link?: string;
    linkTarget?: string;
    routerLink?: boolean;
    color?: ColorType;
    type?: "default" | "primary" | "dashed" | "text";
    size?: Size;
    rounded?: boolean;
    block?: boolean;
    shadow?: "always" | "hover" | "never";
    btnType?: "submit" | "reset" | "button";
  }>(),
  {
    dropdownIcon: (pos: "top" | "bottom") =>
      pos == "top" ? "fas fa-angle-up" : "fas fa-angle-down",
    dropdownLoad: false,
    dropdownDefaultPos: "bottom",
    disabled: false,
    icon: "",
    iconPos: "right",
    loading: false,
    loadingIcon: "fas fa-circle-notch fa-spin",
    loadingIconPos: "same",
    link: "",
    linkTarget: "_blank",
    routerLink: true,
    color: "surface",
    type: "default",
    rounded: false,
    block: false,
    shadow: "never",
    btnType: "button",
  },
);

defineEmits<(e: "click", event: MouseEvent) => void>();
</script>

<template>
  <div class="mcsl-split-button">
    <Button
      :block="block"
      :btn-type="btnType"
      :color="color"
      :disabled="disabled"
      :icon="icon"
      :icon-pos="iconPos"
      :link="link"
      :link-target="linkTarget"
      :loading="loading"
      :loading-icon="loadingIcon"
      :loading-icon-pos="loadingIconPos"
      :rounded="rounded"
      :router-link="routerLink"
      :shadow="shadow"
      :size="size"
      :type="type"
      class="mcsl-split-button__btn1"
      @click="$emit('click', $event)"
    >
      <slot />
    </Button>
    <DropdownMenu :default-pos="dropdownDefaultPos" :menu="dropdownMenu">
      <template #triggerer="{ toggle }">
        <Button
          :color="color"
          :disabled="disabled"
          :icon="dropdownIcon(dropdownDefaultPos)"
          :loading="loading && dropdownLoad"
          :loading-icon="loadingIcon"
          :loading-icon-pos="loadingIconPos"
          :shadow="shadow"
          :size="size"
          :type="type"
          class="mcsl-split-button__btn2"
          @click="toggle"
        />
      </template>
    </DropdownMenu>
  </div>
</template>

<style lang="scss" scoped>
.mcsl-split-button {
  width: fit-content;
  height: fit-content;
  display: flex;
  justify-content: center;
  align-items: center;

  & > .mcsl-button:focus-visible {
    z-index: 1; // 避免outline被遮挡
  }
}

.mcsl-button.mcsl-split-button__btn1 {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.mcsl-button.mcsl-split-button__btn2 {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
