<script lang="ts" setup>
import { ref, type Ref } from "vue";
import MD5 from "crypto-js/md5";
import Page from "../components/page/Page.vue";
import InfoDisplay from "../components/InfoDisplay.vue";
import { useI18n } from "vue-i18n";
import { username } from "../utils/injections.ts";

const i18n = useI18n();
const announcement: Ref<any> = ref(null);
const announcementClosed = ref(localStorage.getItem("announcementClosed"));

(async () => {
  // TODO: 获取公告
  announcement.value = {
    text: "MCServerLauncher Future 是 MCSL开发组 全新的项目！<br>本 Web 程序仅仅是其中的一部分，需要 Daemon 配合使用！<br>同时我们也在制作 WPF 版，可作为本 Web 版的替代！",
    type: "primary",
    closable: true,
  };
})();

function closeAnnouncement() {
  if (announcement.value) {
    const encoded = MD5(announcement.value.text).toString();
    announcementClosed.value = encoded;
    localStorage.setItem("announcementClosed", encoded);
  }
}
</script>

<template>
  <Page>
    <template #breadcrumb>
      <ElBreadcrumb-item>{{ i18n.t("sidebar.home") }}</ElBreadcrumb-item>
    </template>
    <!-- 公告 -->
    <ElAlert
      v-if="
        !announcement.closable ||
        !announcementClosed ||
        announcementClosed != MD5(announcement.text).toString()
      "
      class="home__announcement"
      :title="i18n.t('announcement.title')"
      :type="announcement.type"
      :closable="announcement.closable"
      :close-text="i18n.t('announcement.close')"
      @close="closeAnnouncement"
    >
      <p class="home__announcement-desc" v-html="announcement.text" />
    </ElAlert>

    <div class="home__header">
      <h1>
        欢迎回来{{ username ? "，" : ""
        }}<span>{{ username ? username : "" }}</span
        >！
      </h1>
      <ElSelect>
        <ElOption>awa</ElOption>
      </ElSelect>
    </div>

    <!-- 概览 -->
    <ElCard class="home__card">
      <h1 class="home__card-title">{{ i18n.t("index.overview") }}</h1>
      <ElRow class="home__card-row">
        <ElCol :sm="6" :xs="24" class="home__statistic">
          <ElProgress type="dashboard" :percentage="50">
            <template #default="{ percentage }">
              <div class="home__progress">
                <h2>{{ percentage }}%</h2>
                <h3>114 / 514</h3>
              </div>
            </template>
          </ElProgress>
          <div class="home__progress-title">
            <h2>{{ i18n.t("index.overview.instances") }}</h2>
            <h3>{{ i18n.t("index.overview.instances.desc") }}</h3>
          </div>
        </ElCol>
        <ElCol :sm="6" :xs="24" class="home__statistic">
          <ElProgress type="dashboard" :percentage="50">
            <template #default="{ percentage }">
              <div class="home__progress">
                <h2>{{ percentage }}%</h2>
                <h3 class="home__progress-small">114.51GB / 514.19GB</h3>
              </div>
            </template>
          </ElProgress>
          <div class="home__progress-title">
            <h2>{{ i18n.t("index.overview.disk-usage") }}</h2>
            <h3>{{ i18n.t("index.overview.disk-usage.desc") }}</h3>
          </div>
        </ElCol>
        <ElCol :sm="6" :xs="24" class="home__statistic">
          <div class="home__statistic-info">
            <InfoDisplay
              :title="i18n.t('index.overview.daemon-name')"
              value="某某守护进程"
            />
            <InfoDisplay
              :title="i18n.t('index.overview.daemon-address')"
              value="example.com:11451"
            />
          </div>
        </ElCol>
        <ElCol :sm="6" :xs="24" class="home__statistic">
          <div class="home__statistic-info">
            <InfoDisplay title="不知道写啥" value="114514" />
            <InfoDisplay title="不知道写啥" value="114514" />
          </div>
        </ElCol>
      </ElRow>
    </ElCard>
  </Page>
</template>

<style scoped>
.home__announcement {
  width: calc(100% - 20px);
}

.home__announcement,
.home__card {
  margin: 10px;
  box-shadow: var(--el-box-shadow-light);
  width: calc(100% - 20px);
  border-radius: 15px;
}

.home__announcement.el-alert--info {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.home__announcement.el-alert--success {
  border: 1px solid var(--el-color-success-light-5);
}

.home__announcement.el-alert--primary {
  --el-alert-bg-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  background-color: var(--el-alert-bg-color);
  border: 1px solid var(--el-color-primary-light-5);
}

.home__announcement.el-alert--warning {
  border: 1px solid var(--el-color-warning-light-5);
}

.home__announcement.el-alert--error {
  border: 1px solid var(--el-color-danger-light-5);
}

.home__announcement-desc {
  margin: 0;
}

.home__header {
  margin: 10px;
  width: calc(100% - 20px);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.home__header > h1 {
  margin: 0;
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-extra-large);
}

.home__header > h1 > span {
  color: var(--el-text-color-primary);
}

.home__header > .el-select {
  @media (min-width: 768px) {
    width: 250px;
  }
}

.home__card-row {
  @media (max-width: 768px) {
    gap: 20px;
  }
}

.home__card-title {
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
  margin: 0 0 10px 0;
}

.home__statistic {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
}

.home__statistic-disabled {
  opacity: 0.5;
}

.home__progress,
.home__progress-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.home__progress-title h2 {
  color: var(--el-text-color-primary);
}

.home__progress-title h3 {
  color: var(--el-text-color-regular);
  margin: 0 0 10px 0;
}

.home__progress {
  gap: 5px;
}

.home__progress h2,
.home__progress-title h2 {
  font-weight: var(--el-font-weight-primary);
  font-size: var(--el-font-size-large);
  margin: 0;
}

.home__progress h3,
.home__progress-title h3 {
  font-weight: var(--el-font-weight-primary);
  font-size: var(--el-font-size-base);
}

.home__progress h3 {
  margin: 5px;
}

h3.home__progress-small {
  font-size: 10px;
}

.home__statistic-info {
  margin: 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: column;
  height: 100%;
  @media (max-width: 768px) {
    gap: 35px;
  }
}

.home__statistic-info .info-display {
  width: 100%;
}
</style>

<style>
.home__announcement.el-alert--info .el-alert__title {
  color: var(--el-text-color-regular);
}
</style>
