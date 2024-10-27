<!-- 页面组件（侧边栏右侧） -->
<script setup lang="ts">
</script>

<template>
  <ElContainer direction="vertical">
    <!-- 导航栏 -->
    <PageHeader class="page__header">
      <template #breadcrumb>
        <slot name="breadcrumb"/>
      </template>
      <template #start>
        <slot name="nav-start"/>
      </template>
      <template #end>
        <slot name="nav-end"/>
      </template>
    </PageHeader>
    <!-- 页面内容 -->
    <ElMain class="page__main">
      <ElScrollbar class="page__scroll" view-class="page__scroll-view">
        <slot name="default"/>
        <PageFooter/>
      </ElScrollbar>
    </ElMain>
  </ElContainer>
</template>

<style scoped>
.page__header {
  animation: 0.5s ease-in-out fadeInDown;
}

.page__main {
  padding: 0;
  animation: 0.5s ease-in-out fadeIn;
  width: calc(100% - 20px);
  position: relative;
  left: 10px;
}

.page__scroll {
  height: calc(100% - 20px);
}
</style>

<style>
.page__scroll-view {
  display: flex;
  justify-content: start;
  align-items: center;
  flex-direction: column;
}
</style>