<!-- 侧边栏标题，手机抽屉模式下将会单独放置在抽屉标题部分 -->
<script setup lang="ts">
import { getLogoSrc } from "../../utils/common.js";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
</script>

<template>
  <div class="sidebar__logo-container">
    <ElImage :src="getLogoSrc()" alt="" />
    <p>
      {{ i18n.t("app.name.abbr") }}
      <span>{{ i18n.t("app.name.future") }}</span>
    </p>
  </div>
</template>

<style scoped>
.sidebar__logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.sidebar__collapsed .sidebar__logo-container p {
  display: none;
}

.sidebar__logo-container .el-image {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.sidebar__collapsed .sidebar__logo-container .el-image {
  width: 40px;
  height: 40px;
}

.sidebar__logo-container p {
  font-size: var(--el-font-size-extra-large);
  margin: 0 7px;
  text-align: center;
  color: var(--el-text-color-primary);
}

.sidebar__logo-container p span {
  font-weight: bold;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-dark-2)
  );
  background-clip: text;
}
</style>
