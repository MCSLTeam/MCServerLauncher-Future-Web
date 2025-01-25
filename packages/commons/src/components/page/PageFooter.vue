<!-- 页脚 -->
<script setup lang="ts">
import { useScreenWidth } from "../../utils/uses.js";
import { beian } from "../../utils/injections.ts";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
</script>

<template>
  <div class="footer__container">
    <p>
      Powered by
      <a
        href="https://github.com/MCSLTeam/MCServerLauncher-Future-Web"
        target="_blank"
      >
        {{ i18n.t("app.name.abbr") }} {{ i18n.t("app.name.future") }}
        {{ i18n.t("app.name.suffix") }}
      </a>
      <!-- 备案号 | Web only -->
      <span v-if="beian">
        <span v-if="useScreenWidth().isMdOrBigger"> &ensp;|&ensp; </span>
        <br v-if="useScreenWidth().width == 'sm'" />
        <a href="https://beian.miit.gov.cn/" target="_blank">
          {{ beian }}
        </a>
      </span>
    </p>
  </div>
</template>

<style scoped>
.footer__container {
  width: calc(100% - 40px);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

.footer__container p {
  margin: 0;
  color: var(--el-text-color-regular);
}

.footer__container a {
  color: var(--el-text-color-primary);
  transition: 0.3s ease-in-out;
  text-decoration: none;
}

.footer__container a:hover {
  color: var(--el-color-primary);
}
</style>
