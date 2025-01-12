<!-- 默认布局 -->
<script setup lang="ts">
import Layout from "@repo/commons/src/Layout.vue";
</script>

<template>
  <Layout>
    <slot />
  </Layout>
</template>

<style scoped>
.default-layout__max-screen {
  width: 100%;
  height: 100%;
}

.default-layout__sidebar {
  animation: 0.5s ease-in-out fadeInLeft;
}
</style>
