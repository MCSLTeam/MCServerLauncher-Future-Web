<script setup lang="ts">
import MainLayout from "./MainLayout.vue";
import Sidebar from "../components/dashboard/Sidebar.vue";
import Breadcrumbs from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { Notification } from "@repo/ui/src/utils/notifications.ts";
import { onMounted } from "vue";

onMounted(() => {
  new Notification({
    data: {
      message: "一条测试通知～",
    },
    duration: 114514,
  });
});
</script>

<template>
  <MainLayout>
    <div class="dashboard">
      <Sidebar />
      <div class="dashboard__main">
        <div class="dashboard__nav">
          <div>
            <Button
              type="text"
              icon="fa fa-angles-left"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'折叠侧边栏'"
            />
            <Button
              type="text"
              icon="fa fa-angle-left"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'上一页'"
            />
            <Button
              type="text"
              icon="fa fa-angle-right"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'下一页'"
            />
            <Breadcrumbs :items="[{ label: '仪表盘', path: '/dashboard' }]" />
          </div>
          <div>
            <Button
              type="text"
              icon="fa fa-bell"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'通知'"
            />
            <Button
              type="text"
              icon="fa fa-brush"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'自定义界面'"
            />
            <Button
              type="text"
              icon="fa fa-user"
              rounded
              size="small"
              shadow="never"
              v-tooltip="'用户中心'"
            />
          </div>
        </div>
        <div class="dashboard__content"></div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.dashboard {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--mcsl-bg-color-overlay);
}

.dashboard__main {
  height: calc(100vh - 2 * var(--mcsl-spacing-md));
  margin: var(--mcsl-spacing-md);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.dashboard__nav {
  height: 1rem;
  padding: var(--mcsl-spacing-xs) 0 var(--mcsl-spacing-md) 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }
}

.dashboard__content {
  background: var(--mcsl-bg-color-main);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-md);
  flex-grow: 1;
}
</style>
