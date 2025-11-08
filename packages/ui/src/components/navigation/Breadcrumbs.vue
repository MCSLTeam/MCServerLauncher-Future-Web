<script lang="ts" setup>
import { computed } from "vue";

export type BreadcrumbItem = {
  label: string;
  path: string;
  icon?: string;
};

const props = defineProps<{
  items: BreadcrumbItem[];
  seperator?: string;
  iconSeperator?: boolean;
}>();

const actualSeperator = computed(() => props.seperator ?? "fa fa-angle-right");
const actuallyIconSeperator = computed(() =>
  props.seperator == undefined ? true : props.iconSeperator,
);
</script>

<template>
  <nav class="mcsl-breadcrumbs">
    <template v-for="(item, index) in items" :key="index">
      <span v-if="index > 0">
        <i v-if="actuallyIconSeperator" :class="actualSeperator" />
        <template v-else>{{ actualSeperator }} </template>
      </span>
      <router-link :to="item.path">
        <i v-if="item.icon" :class="item.icon" />
        {{ item.label }}
      </router-link>
    </template>
  </nav>
</template>

<style lang="scss" scoped>
.mcsl-breadcrumbs {
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  & > span,
  & > span > i {
    color: var(--mcsl-text-color-gray);
  }

  & > a {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-4xs);
    text-decoration: none;

    &,
    & > i {
      color: var(--mcsl-text-color-secondary);
    }

    &:last-child {
      font-weight: var(--mcsl-font-weight-bold);

      &,
      & > i {
        color: var(--mcsl-text-color-primary);
      }
    }

    &:hover,
    &:hover > i {
      color: var(--mcsl-color-primary);
    }
  }
}
</style>
