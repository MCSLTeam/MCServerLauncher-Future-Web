<script lang="ts" setup>
import Panel from "./Panel.vue";
import type { Size } from "../../utils/utils.ts";

withDefaults(
  defineProps<{
    disabled?: boolean;
    header?: string;
    headerDivider?: boolean;
    shadow?: "always" | "hover" | "never";
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
    scrollable?: boolean;
  }>(),
  { headerDivider: true },
);

const emit = defineEmits<{
  (e: "collapse"): void;
  (e: "expand"): void;
}>();

const collapsed = defineModel<boolean>("collapsed", {
  default: true,
});

function collapse() {
  collapsed.value = true;
  emit("collapse");
}

function expand() {
  collapsed.value = false;
  emit("expand");
}

function toggle() {
  if (collapsed.value) {
    expand();
  } else {
    collapse();
  }
}

defineExpose({
  collapse,
  expand,
  toggle,
});
</script>

<template>
  <Panel
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :class="{
      'mcsl-collapsable-panel__collapsed': collapsed,
      'mcsl-collapsable-panel__disabled': disabled,
    }"
    :header="header"
    :header-class="headerClass"
    :header-style="headerStyle"
    :header-divider="headerDivider"
    :scrollable="scrollable"
    :shadow="shadow"
    :size="size"
    class="mcsl-collapsable-panel"
  >
    <template #header>
      <div
        v-if="header || $slots.header"
        class="mcsl-collapsable-panel__header"
        @click="
          () => {
            if (!disabled) toggle();
          }
        "
      >
        <div>
          <slot name="header">
            <h2>{{ header }}</h2>
          </slot>
        </div>
        <i class="fa fa-angle-up" />
      </div>
    </template>
    <template #contextmenu>
      <slot name="contextmenu" />
    </template>
    <slot />
  </Panel>
</template>

<style lang="scss" scoped>
.mcsl-collapsable-panel {
  transition: 0.2s ease-in-out;

  & .mcsl-collapsable-panel__header {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;

    & > i {
      transition: 0.2s ease-in-out;
    }
  }
}

.mcsl-collapsable-panel.mcsl-collapsable-panel__collapsed {
  & .mcsl-collapsable-panel__header > i {
    transform: rotate(-180deg);
  }
}
</style>

<style lang="scss">
.mcsl-collapsable-panel {
  & > .mcsl-panel__header {
    transition: 0.2s ease-in-out;
  }

  & > .mcsl-panel__body-wrapper {
    overflow: hidden;
    max-height: 1000px;
    transition: 0.8s ease-in-out;
  }
}

.mcsl-collapsable-panel.mcsl-collapsable-panel__collapsed {
  & > .mcsl-panel__header {
    padding-bottom: 0;
  }

  & > .mcsl-panel__body-wrapper {
    max-height: 0;
    transition: 1s cubic-bezier(0, 1, 0, 1);
  }
}

.mcsl-collapsable-panel.mcsl-collapsable-panel__disabled {
  background: var(--mcsl-bg-color-dark);

  & .mcsl-collapsable-panel__header {
    cursor: not-allowed;
    color: var(--mcsl-text-color-gray);
  }
}
</style>
