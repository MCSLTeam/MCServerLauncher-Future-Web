<script lang="ts" setup>
import Panel from "./Panel.vue";
import Button from "../form/button/Button.vue";
import type { ColorType } from "../../utils/css.ts";
import type { Size } from "../../utils/types.ts";
import Divider from "../misc/Divider.vue";

export type MenuInfo = {
  group?: string;
  items: {
    label: "default" | string;
    icon?: string;
    iconPos?: "left" | "right";
    onClick?: (event: MouseEvent) => void | Promise<void>;
    disabled?: boolean;
    type?: "default" | "primary" | "dashed" | "text";
    color?: ColorType;
    buttonType?: "submit" | "reset" | "button";
  }[];
}[];

withDefaults(
  defineProps<{
    menu: MenuInfo;
    header?: string;
    headerDivider?: boolean;
    shadow?: boolean;
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
  }>(),
  {
    shadow: false,
  },
);
</script>

<template>
  <Panel
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :header="header"
    :header-class="headerClass"
    :header-divider="headerDivider"
    :header-style="headerStyle"
    :shadow="shadow ? 'always' : 'never'"
    :size="size"
    class="mcsl-menu"
  >
    <template #header>
      <slot name="header" />
    </template>
    <template #contextmenu>
      <slot name="contextmenu" />
    </template>
    <div
      v-for="(item, index) in menu as MenuInfo"
      :key="index"
      class="mcsl-menu__group"
    >
      <Divider v-if="index > 0" spacing="4xs" />
      <h5 v-if="item?.group">
        {{ item.group }}
      </h5>
      <div class="mcsl-menu__items">
        <Button
          v-for="button in item.items"
          :key="button.label"
          :btn-type="button.buttonType"
          :color="button.color"
          :disabled="button.disabled"
          :icon="button.icon"
          :icon-pos="button.iconPos"
          :type="button.type ?? 'text'"
          shadow="never"
          @click="button.onClick"
        >
          {{ button.label }}
        </Button>
      </div>
    </div>
  </Panel>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "Panel" as *;

$vars: (
  "spacing": (
    "small": var(--mcsl-spacing-4xs),
    "middle": var(--mcsl-spacing-2xs),
    "large": var(--mcsl-spacing-xs),
  ),
  "border-radius": (
    "small": var(--mcsl-border-radius-sm),
    "middle": var(--mcsl-border-radius-lg),
    "large": var(--mcsl-border-radius-2xl),
  ),
  "width": (
    "small": 8rem,
    "middle": 10rem,
    "large": 12rem,
  ),
);

@each $size in utils.$sizes {
  $spacing: utils.get-size-var("spacing", $size, $vars);
  .mcsl-size-#{$size} {
    &.mcsl-panel.mcsl-menu {
      width: calc(
        var(--mcsl-menu__width, utils.get-size-var("width", $size, $vars)) -
          2 *
          $spacing
      );
      border-radius: utils.get-size-var("border-radius", $size, $vars);
      padding: $spacing;
    }

    .mcsl-menu__group {
      & > h5 {
        margin: calc($spacing / 2);
      }
    }

    .mcsl-menu__items {
      gap: calc($spacing / 2);
    }
  }
}

.mcsl-menu__items {
  display: flex;
  flex-direction: column;

  & > button {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
