<!-- 导航栏 -->
<script setup lang="ts">
import { ref } from "vue";
import { useScreenWidth } from "../../utils/uses";
import SidebarLogo from "../sidebar/SidebarLogo.vue";
import Sidebar from "../sidebar/Sidebar.vue";

const showSidebar = ref(false);
</script>

<template>
  <ElHeader class="header__container el-card" data-tauri-drag-region>
    <!-- 面包屑 -->
    <div>
      <ElBreadcrumb separator="/">
        <slot name="breadcrumb" />
      </ElBreadcrumb>
      <slot name="start" />
    </div>
    <!-- 手机端侧边栏抽屉 -->
    <div>
      <ElDrawer
        v-if="useScreenWidth().width == 'sm'"
        v-model="showSidebar"
        class="header__sidebar-drawer"
        size="80%"
        direction="ltr"
      >
        <template #header>
          <SidebarLogo />
        </template>
        <Sidebar :is-in-drawer="true" />
      </ElDrawer>
      <slot name="end" />
      <!-- 打开侧边栏按钮 -->
      <ElButton
        v-if="useScreenWidth().width == 'sm'"
        class="header__menu-button"
        @click="showSidebar = true"
      >
        <i class="fa fa-bars" />
      </ElButton>
    </div>
  </ElHeader>
</template>

<style scoped>
.header__container {
  width: calc(100% - 40px);
  height: 60px;
  margin: 20px 20px 10px 20px;
  border-radius: 15px;
  padding: 10px 20px;
  border: 1px solid var(--el-card-border-color);
  box-shadow: var(--el-box-shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header__menu-button {
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 7px;
}
</style>

<style>
.header__sidebar-drawer .el-drawer__header {
  margin-bottom: 0;
}

.header__sidebar-drawer .el-drawer__body {
  padding-top: 0;
}
</style>
