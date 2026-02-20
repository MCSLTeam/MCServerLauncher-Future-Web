<script setup lang="ts">
import { useAccount } from "../../utils/store.ts";
</script>

<template>
  <ul class="permissions">
    <li v-for="perm in useAccount().selfInfo.permissions" :key="perm">
      <h4>{{ perm.replaceAll("*", "＊") }}</h4>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.permissions {
  flex: 1;
  height: 20rem;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
  overflow: auto;
  background: var(--mcsl-bg-color-main);
  margin: 0;
  padding: var(--mcsl-spacing-xs);
  padding-left: var(--mcsl-spacing-lg);
  border-radius: var(--mcsl-border-radius-md);

  & h4 {
    font-feature-settings: "ss08";
  }
}
</style>
