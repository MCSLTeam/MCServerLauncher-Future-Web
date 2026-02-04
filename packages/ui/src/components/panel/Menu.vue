<script lang="ts" setup>
import Panel from "./Panel.vue";
import Button from "../form/button/Button.vue";
import type { ColorType } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";
import Divider from "../misc/Divider.vue";
import { computed } from "vue";

export type MenuItem = {
  label: "default" | string;
  icon?: string;
  iconPos?: "left" | "right";
  onClick?: (event: MouseEvent) => void | Promise<void>;
  disabled?: boolean;
  type?: "default" | "primary" | "dashed" | "text";
  color?: ColorType;
  buttonType?: "submit" | "reset" | "button";
};

export type MenuInfo =
  | {
      group: string;
      items: MenuItem[];
    }[]
  | MenuItem[];

const props = withDefaults(
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
    scrollable?: boolean;
  }>(),
  {
    shadow: false,
    headerDivider: true,
  },
);

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const menuInfo = computed(() => {
  if (props.menu.length == 0) return [];

  let info: { group?: string; items: MenuItem[] }[];
  if ((props.menu as any)[0].group) {
    info = props.menu as any;
  } else {
    info = [
      {
        items: props.menu as MenuItem[],
      },
    ];
  }
  return info;
});
</script>

<template>
  <Panel
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :header="header"
    :header-class="headerClass"
    :header-divider="headerDivider"
    :header-style="headerStyle"
    :scrollable="scrollable"
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
      v-for="(item, index) in menuInfo"
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
          @click="
            (e) => {
              button?.onClick?.(e);
              $emit('click', e);
            }
          "
        >
          {{ button.label }}
        </Button>
      </div>
    </div>
  </Panel>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";
@use "sass:map";
@use "Panel";

$vars: map.merge(
  Panel.$vars,
  (
    "spacing": (
      "small": var(--mcsl-spacing-4xs),
      "medium": var(--mcsl-spacing-2xs),
      "large": var(--mcsl-spacing-xs),
    ),
    "width": (
      "small": 10rem,
      "medium": 12rem,
      "large": 14rem,
    ),
  )
);

@each $size in utils.$sizes {
  $spacing: utils.get-size-var("spacing", $size, $vars);
  .mcsl-size-#{$size} {
    &.mcsl-panel.mcsl-menu {
      min-width: calc(utils.get-size-var("width", $size, $vars) - 2 * $spacing);
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
    &:focus-visible {
      z-index: 10; // 避免outline被遮挡
    }
  }
}
</style>
