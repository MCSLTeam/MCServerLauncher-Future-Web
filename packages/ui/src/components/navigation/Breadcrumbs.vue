<script lang="ts" setup>
import { computed } from "vue";
import { navigateTo, type PageNavigationInfo } from "../../utils/utils.ts";
import { useRouter } from "vue-router";

const props = defineProps<{
  items: PageNavigationInfo[];
  seperator?: string;
  iconSeperator?: boolean;
}>();

const router = useRouter();

const actualSeperator = computed(() => props.seperator ?? "/");
</script>

<template>
  <nav class="mcsl-breadcrumbs">
    <template v-for="(item, index) in items" :key="index">
      <span v-if="index > 0">
        <i v-if="iconSeperator" :class="iconSeperator" />
        <template v-else>{{ actualSeperator }} </template>
      </span>
      <component
        :is="(item.link || item.onClick) && !item.disabled ? 'a' : 'p'"
        href="javascript:void(0)"
        @click="navigateTo(item, router)"
      >
        <i v-if="item.icon" :class="item.icon" />
        {{ item.label }}
      </component>
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
