<!-- 侧边栏 -->
<script lang="ts" setup>
import { ref } from "vue";
import NewInstanceDialog from "./NewInstanceDialog.vue";
import TasksDialog from "./TasksDialog.vue";
import { useScreenWidth } from "../../utils/uses";
import { tasks, TaskStatus } from "../../utils/tasks";
import SidebarLogo from "./SidebarLogo.vue";
import { router } from "../../utils/injections.ts";
import { useLocalStorage } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { showDaemonList } from "../../utils/daemon/daemons.ts";

defineProps({
  isInDrawer: {
    // 是否为手机端抽屉模式
    type: Boolean,
    required: false,
    default: false,
  },
});

const i18n = useI18n();
const showNewInstance = ref(false); // 新建实例对话框
const showTasks = ref(false); // 任务对话框
const isCollapsed = useLocalStorage("sidebar-collapsed", false); // 侧边栏是否折叠
const expandedButtonIndex = ref(0); // 当前展开的底部按钮索引
</script>

<template>
  <ElAside
    v-if="useScreenWidth().isMdOrBigger || isInDrawer"
    class="sidebar__aside el-card"
    :class="{
      sidebar__collapsed:
        !isInDrawer && (useScreenWidth().width == 'md' || isCollapsed),
      sidebar__standalone: !isInDrawer,
    }"
  >
    <!-- 标题，手机端模式下不显示（塞到了抽屉的标题部分分开来） -->
    <SidebarLogo v-if="!isInDrawer" />
    <div class="sidebar__menu-items">
      <ElScrollbar>
        <!-- 上半部分 -->
        <div>
          <ElButton
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item-selected':
                router.currentRoute.value.fullPath === '/',
            }"
            @click="router.push('/')"
          >
            <i class="fa fa-home" /><span>{{ i18n.t("sidebar.home") }}</span>
          </ElButton>

          <ElButton
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item-selected':
                router.currentRoute.value.fullPath === '/instances',
            }"
            @click="router.push('/instances')"
          >
            <i class="fa fa-server" /><span>{{
              i18n.t("sidebar.instances")
            }}</span>
          </ElButton>

          <ElButton
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item-selected':
                router.currentRoute.value.fullPath === '/news',
            }"
            @click="router.push('/news')"
          >
            <i class="fa fa-newspaper" /><span>{{
              i18n.t("sidebar.news")
            }}</span>
          </ElButton>

          <ElButton
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item-selected':
                router.currentRoute.value.fullPath === '/help-center',
            }"
            disabled
            @click="router.push('/help-center')"
          >
            <i class="fa fa-question" /><span>{{
              i18n.t("sidebar.help-center")
            }}</span>
          </ElButton>

          <!-- 调试工具 TODO: 生产环境删了 -->
          <ElButton
            class="sidebar__menu-item"
            :class="{
              'sidebar__menu-item-selected':
                router.currentRoute.value.fullPath === '/debug',
            }"
            @click="router.push('/debug')"
          >
            <i class="fa fa-bug" /><span>Debug</span>
          </ElButton>
        </div>

        <!-- 下半部分 -->
        <div>
          <ElButton
            class="sidebar__menu-item-primary sidebar__menu-item"
            @click="showNewInstance = true"
          >
            <i class="fa fa-plus" /><span>{{
              i18n.t("sidebar.newInstance")
            }}</span>
          </ElButton>
          <!-- 新建实例对话框 -->
          <NewInstanceDialog v-model="showNewInstance" />

          <ElBadge
            style="width: 100%"
            type="primary"
            :offset="[-30, 22]"
            :show-zero="false"
            :value="
              tasks.filter((t) => t.status.value === TaskStatus.Processing)
                .length
            "
          >
            <ElButton
              class="sidebar__menu-item-secondary sidebar__menu-item"
              @click="showTasks = true"
            >
              <i class="fa fa-tasks" /><span>{{
                i18n.t("sidebar.tasks")
              }}</span>
            </ElButton>
          </ElBadge>
          <!-- 任务对话框 -->
          <TasksDialog v-model="showTasks" />

          <!-- 底部折叠按钮，手机端平铺 -->
          <div class="sidebar__square-item-group">
            <ElButton
              class="sidebar__menu-item sidebar__square-item"
              :class="{
                'sidebar__square-item-expanded': expandedButtonIndex == 0,
              }"
              @mouseenter="expandedButtonIndex = 0"
              @click="showDaemonList = true"
            >
              <i class="fa fa-cloud" /><span>{{
                i18n.t("sidebar.daemon")
              }}</span>
            </ElButton>

            <ElButton
              class="sidebar__menu-item sidebar__square-item"
              :class="{
                'sidebar__menu-item-selected':
                  router.currentRoute.value.fullPath === '/settings',
                'sidebar__square-item-expanded': expandedButtonIndex == 1,
              }"
              @mouseenter="expandedButtonIndex = 1"
              @click="router.push('/settings')"
            >
              <i class="fa fa-gear" /><span>{{
                i18n.t("sidebar.settings")
              }}</span>
            </ElButton>

            <!-- 折叠侧边栏按钮，仅大屏模式下显示 -->
            <ElButton
              class="sidebar__menu-item sidebar__menu-item-secondary sidebar__square-item sidebar__collapse-button"
              :class="{
                'sidebar__square-item-expanded': expandedButtonIndex == 2,
              }"
              @click="isCollapsed = !isCollapsed"
              @mouseenter="expandedButtonIndex = 2"
            >
              <i class="fa fa-angle-left" /><span>{{
                i18n.t("sidebar.collapse")
              }}</span>
            </ElButton>
          </div>
        </div>
      </ElScrollbar>
    </div>
  </ElAside>
</template>

<style scoped>
.sidebar__aside {
  margin: 0 10px 10px 10px;
  overflow: hidden;
  width: calc(100% - 20px);
  height: calc(100% - 10px);
  padding: 0 10px 10px 10px;
  border: none;
}

.sidebar__aside,
.sidebar__aside * {
  transition: 0.3s ease-in-out;
}

.sidebar__standalone {
  margin: 20px 0 20px 20px;
  padding: 20px;
  width: 20%;
  max-width: 17rem;
  height: calc(100% - 40px);
  border-radius: 15px;
  border: 1px solid var(--el-card-border-color);
  box-shadow: var(--el-box-shadow);
}

.tauri-desktop .sidebar__standalone {
  padding: 40px 20px 20px 20px;
}

.sidebar__collapsed {
  width: 65px;
  padding: 10px;
}

.sidebar__menu-item i {
  margin-right: 5px;
  width: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__menu-items {
  margin-top: 20px;
  border: none;
  align-items: center;
  height: calc(100% - 68px);
}

.sidebar__menu-items > div {
  width: 100%;
  overflow: hidden;
}

.sidebar__collapsed .sidebar__menu-items {
  height: calc(100% - 60px);
}

.sidebar__menu-item {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: none;
  padding-left: 20px;
  margin: 2.5px 0 !important;
  justify-content: start;
  overflow: hidden;
}

.sidebar__collapsed .sidebar__menu-item span,
.sidebar__collapse-button,
.sidebar__standalone .sidebar__square-item span {
  display: none;
}

.sidebar__menu-item:hover:not(:disabled) {
  color: var(--el-text-color-regular);
  background: var(--el-color-primary-light-9);
}

.sidebar__menu-item-selected {
  color: var(--el-color-primary) !important;
  background: var(--el-color-primary-light-8) !important;
}

.sidebar__menu-item-primary {
  background: var(--el-color-primary-light-7);
}

.sidebar__menu-item-primary:hover {
  background: var(--el-color-primary-light-5) !important;
}

.sidebar__menu-item-secondary {
  background: var(--el-color-primary-light-9);
}

.sidebar__menu-item-secondary:hover {
  background: var(--el-color-primary-light-7) !important;
}

.sidebar__collapsed .sidebar__menu-item,
.sidebar__square-item {
  justify-content: center;
  padding-left: 20px !important;
}

.sidebar__standalone .sidebar__square-item {
  width: 40px;
}

.sidebar__standalone .sidebar__square-item-expanded {
  width: calc(100% - 50px);
  padding-left: 10px;
}

.sidebar__collapsed .sidebar__square-item-expanded,
.sidebar__collapsed .sidebar__menu-item {
  width: 40px;
}

.sidebar__standalone .sidebar__square-item-expanded span {
  display: unset;
  width: 100%;
}

.sidebar__standalone.sidebar__collapsed .sidebar__square-item-expanded span {
  display: none !important;
}

.sidebar__standalone .sidebar__square-item-expanded span {
  font-size: var(--el-font-size-small);
}

.sidebar__collapsed .sidebar__collapse-button i {
  transform: rotate(180deg);
}

.sidebar__square-item-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
}

.sidebar__collapsed .sidebar__square-item-group {
  flex-direction: column;
  gap: 0;
}

@media (min-width: 1024px) {
  .sidebar__collapse-button {
    display: flex;
  }

  .sidebar__square-item-expanded {
    width: calc(100% - 95px);
  }
}
</style>

<style>
.sidebar__menu-items .el-scrollbar__view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
