<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import DropdownContent from "../../overlay/DropdownContent.vue";
import Tree from "../../navigation/Tree.vue";
import type { TreeNode } from "../../../utils/tree.ts";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    items: TreeNode[];
    placeholder?: string;
    color?: ColorType;
    size?: Size;
    disabled?: boolean;
    invalid?: boolean;
    clearable?: boolean;
  }>(),
  {
    items: () => [],
    placeholder: "Select item",
    color: "primary",
    size: "medium",
    disabled: false,
    invalid: false,
    clearable: true,
  },
);

const model = defineModel<string>({
  default: "",
});

const dropdownRef = ref();
const expandedKeys = ref<string[]>([]);
const selectedKeys = computed({
  get: () => (model.value ? [model.value] : []),
  set: (value: string[]) => {
    model.value = value[0] ?? "";
    dropdownRef.value?.close();
  },
});

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  model.value = formField.field.data.value ?? "";

  watch(formField.field.data, (value) => {
    if (value != model.value) model.value = value ?? "";
  });

  watch(model, (value) => {
    if (value != formField.field.data.value) formField.field.data.value = value;
  });
}

const selectedLabel = computed(() => {
  function find(nodes: TreeNode[]): string | undefined {
    for (const node of nodes) {
      if (node.key === model.value) return node.label;
      const child = node.children ? find(node.children) : undefined;
      if (child) return child;
    }
    return undefined;
  }

  return model.value ? find(props.items) : undefined;
});

function clearValue() {
  model.value = "";
}
</script>

<template>
  <DropdownContent ref="dropdownRef" class="mcsl-tree-select">
    <template #triggerer="{ toggle, opened }">
      <button
        type="button"
        class="mcsl-tree-select__trigger"
        :class="[`mcsl-size-${size}`]"
        :disabled="disabled"
        :aria-invalid="
          invalid || formField?.field?.error?.value ? 'true' : undefined
        "
        :style="{
          '--mcsl-tree-select__color-light': getColorVar(
            new ColorData(color, 'light'),
          ),
          '--mcsl-tree-select__color': getColorVar(color),
        }"
        @click="toggle"
      >
        <span v-if="selectedLabel">{{ selectedLabel }}</span>
        <span v-else class="mcsl-tree-select__placeholder">{{
          placeholder
        }}</span>
        <span
          v-if="clearable && model"
          class="mcsl-tree-select__clear"
          role="button"
          tabindex="0"
          @click.stop="clearValue"
          @keydown.enter.stop.prevent="clearValue"
          @keydown.space.stop.prevent="clearValue"
        >
          <i class="fa fa-xmark" />
        </span>
        <i class="fa fa-angle-down" :class="{ 'fa-rotate-180': opened }" />
      </button>
    </template>
    <div
      class="mcsl-tree-select__panel"
      :style="{
        width: dropdownRef?.triggererPos?.width
          ? `max(${dropdownRef.triggererPos.width}px, 14rem)`
          : '14rem',
      }"
    >
      <Tree
        v-model:expanded-keys="expandedKeys"
        v-model:selected-keys="selectedKeys"
        :items="items"
        :size="size"
      />
    </div>
  </DropdownContent>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

.mcsl-tree-select {
  display: block;
  width: 100%;
}

.mcsl-tree-select__trigger {
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--mcsl-spacing-2xs);
  box-sizing: border-box;
  border: 1px solid var(--mcsl-border-color-base);
  background: var(--mcsl-bg-color-overlay);
  color: var(--mcsl-text-color-primary);
  outline: 0 solid transparent;
  outline-offset: -2px;
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    outline-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard);
}

.mcsl-tree-select__trigger > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mcsl-tree-select__trigger > i {
  color: var(--mcsl-text-color-secondary);
  transition: transform var(--mcsl-motion-duration-fast)
    var(--mcsl-motion-ease-standard);
}

.mcsl-tree-select__clear {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  flex: 0 0 auto;
  border-radius: 999px;
  color: var(--mcsl-text-color-secondary);
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-tree-select__clear:hover {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
  color: var(--mcsl-text-color-primary);
}

.mcsl-tree-select__trigger > i.fa-rotate-180 {
  transform: rotate(180deg);
}

.mcsl-tree-select__trigger:hover {
  border-color: var(--mcsl-border-color-dark);
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}

.mcsl-tree-select__trigger:focus {
  outline-color: var(--mcsl-tree-select__color-light);
  outline-width: 2px;
  border-color: color-mix(
    in srgb,
    var(--mcsl-tree-select__color) 48%,
    var(--mcsl-border-color-base)
  );
}

.mcsl-tree-select__trigger[aria-invalid="true"] {
  border-color: var(--mcsl-color-danger);
}

.mcsl-tree-select__trigger:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.mcsl-tree-select__placeholder {
  color: var(--mcsl-text-color-secondary);
}

.mcsl-tree-select__panel {
  box-sizing: border-box;
  max-width: calc(100vw - 2 * var(--mcsl-spacing-md));
  max-height: 18rem;
  overflow: auto;
  padding: var(--mcsl-spacing-2xs);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-overlay);
  box-shadow: var(--mcsl-box-shadow-base);
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-tree-select__trigger {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));
    $height: utils.get-size-var("height", $size, $vars);

    height: $height;
    padding: 0 calc($spacing * 1.2) 0 calc($spacing * 1.4);
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    font-size: utils.get-size-var("font-size", $size, $vars);
  }
}
</style>
