<script setup lang="ts">
import { computed } from "vue";
import type { Size } from "../../utils/utils.ts";
import type { TreeNode } from "../../utils/tree.ts";

type FlatTreeNode = {
  node: TreeNode;
  depth: number;
};

const props = withDefaults(
  defineProps<{
    items: TreeNode[];
    multiple?: boolean;
    size?: Size;
  }>(),
  {
    items: () => [],
    multiple: false,
    size: "medium",
  },
);

const selectedKeys = defineModel<string[]>("selectedKeys", {
  default: () => [],
});
const expandedKeys = defineModel<string[]>("expandedKeys", {
  default: () => [],
});

const visibleNodes = computed(() => {
  const result: FlatTreeNode[] = [];

  function visit(nodes: TreeNode[], depth: number) {
    for (const node of nodes) {
      result.push({ node, depth });
      if (node.children?.length && expandedKeys.value.includes(node.key)) {
        visit(node.children, depth + 1);
      }
    }
  }

  visit(props.items, 0);
  return result;
});

function isExpanded(node: TreeNode) {
  return expandedKeys.value.includes(node.key);
}

function isSelected(node: TreeNode) {
  return selectedKeys.value.includes(node.key);
}

function toggleExpanded(node: TreeNode) {
  if (!node.children?.length) return;
  expandedKeys.value = isExpanded(node)
    ? expandedKeys.value.filter((key) => key !== node.key)
    : [...expandedKeys.value, node.key];
}

function selectNode(node: TreeNode) {
  if (node.disabled || node.selectable === false) return;
  if (props.multiple) {
    selectedKeys.value = isSelected(node)
      ? selectedKeys.value.filter((key) => key !== node.key)
      : [...selectedKeys.value, node.key];
    return;
  }
  selectedKeys.value = [node.key];
}
</script>

<template>
  <div class="mcsl-tree" :class="[`mcsl-size-${size}`]" role="tree">
    <div
      v-for="{ node, depth } in visibleNodes"
      :key="node.key"
      class="mcsl-tree__item"
      :class="{
        'mcsl-tree__item--selected': isSelected(node),
        'mcsl-tree__item--disabled': node.disabled,
      }"
      :style="{ '--mcsl-tree__depth': depth }"
      role="treeitem"
      :aria-expanded="node.children?.length ? isExpanded(node) : undefined"
      :aria-selected="isSelected(node)"
    >
      <button
        class="mcsl-tree__toggle"
        type="button"
        :disabled="!node.children?.length"
        @click.stop="toggleExpanded(node)"
      >
        <i
          v-if="node.children?.length"
          class="fa fa-angle-right"
          :class="{ 'mcsl-tree__toggle-icon--expanded': isExpanded(node) }"
        />
      </button>
      <button
        class="mcsl-tree__label"
        type="button"
        :disabled="node.disabled || node.selectable === false"
        @click="selectNode(node)"
      >
        <i v-if="node.icon" :class="node.icon" />
        <span>{{ node.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";
@use "../SmallerContent" as *;

.mcsl-tree {
  display: grid;
  gap: 2px;
  min-width: 0;
  color: var(--mcsl-text-color-regular);
}

.mcsl-tree__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 2px;
  padding-left: calc(var(--mcsl-tree__depth) * 1rem);
}

.mcsl-tree__toggle,
.mcsl-tree__label {
  border: 0;
  background: transparent;
  color: inherit;
}

.mcsl-tree__toggle {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: var(--mcsl-border-radius-sm);
  color: var(--mcsl-text-color-secondary);
  cursor: pointer;
}

.mcsl-tree__toggle:disabled {
  cursor: default;
}

.mcsl-tree__toggle-icon--expanded {
  transform: rotate(90deg);
}

.mcsl-tree__toggle i {
  transition: transform var(--mcsl-motion-duration-fast)
    var(--mcsl-motion-ease-standard);
}

.mcsl-tree__label {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--mcsl-spacing-2xs);
  border-radius: var(--mcsl-border-radius-sm);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-tree__label span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mcsl-tree__label:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
  color: var(--mcsl-text-color-primary);
}

.mcsl-tree__item--selected .mcsl-tree__label {
  background: color-mix(
    in srgb,
    var(--mcsl-color-primary) 11%,
    var(--mcsl-bg-color-overlay)
  );
  color: var(--mcsl-color-primary);
}

.mcsl-tree__item--disabled {
  opacity: 0.52;
}

.mcsl-tree__label:disabled {
  cursor: not-allowed;
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-tree {
    font-size: utils.get-size-var("font-size", $size, $vars);

    .mcsl-tree__label {
      min-height: calc(utils.get-size-var("height", $size, $vars) * 0.78);
      padding: 0 utils.get-size-var("spacing", $size, $vars);
    }
  }
}
</style>
