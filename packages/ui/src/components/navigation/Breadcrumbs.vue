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
        <i v-if="iconSeperator" :class="String(iconSeperator)" />
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
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);

  & > span,
  & > span > i {
    color: var(--mcsl-text-color-secondary);
    font-size: var(--mcsl-font-size-sm);
  }

  & > a,
  & > p {
    display: inline-flex;
    align-items: center;
    gap: var(--mcsl-spacing-4xs);
    text-decoration: none;
    color: var(--mcsl-text-color-secondary);
    transition: color 0.14s ease-out;
  }

  & > a > i,
  & > p > i {
    color: inherit;
  }

  & > :last-child {
    font-weight: var(--mcsl-font-weight-bold);
    color: var(--mcsl-text-color-primary);
  }

  & > a:hover,
  & > a:hover > i {
    color: var(--mcsl-color-primary);
  }
}
</style>
