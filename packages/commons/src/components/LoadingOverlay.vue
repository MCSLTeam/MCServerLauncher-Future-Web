<script setup lang="ts">
import FancyBackground from "./FancyBackground.vue";
import { canHideOverlay, mcslLoadingInfo } from "../utils/loader";
import { getLogoSrc } from "../utils/common";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
</script>

<template>
  <!-- 加载中 -->
  <transition name="fade" mode="out-in">
    <div v-show="!canHideOverlay" class="loading-overlay__loading">
      <FancyBackground light="5" />
      <img :src="getLogoSrc()" alt="" />
      <h1>
        {{ i18n.t("app.name") }}
        <span>{{ i18n.t("app.name.future") }}</span>
      </h1>
      <div>
        <div v-loading="true" class="loading-overlay__loading-icon" />
        <p class="loading-overlay__loading-text">
          {{ mcslLoadingInfo.getMessage() }}
        </p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loading-overlay__loading {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  position: fixed;
  top: 0;
  left: 0;
}

.loading-overlay__loading > * {
  z-index: 114;
}

.loading-overlay__loading h1 {
  margin: 0;
  font-size: 3rem;
  text-align: center;
}

.loading-overlay__loading > div {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.loading-overlay__loading img {
  width: 7rem;
}

.loading-overlay__loading > h1 {
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.loading-overlay__loading > h1 span {
  font-weight: bold;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-dark-2)
  );
  background-clip: text;
}

.loading-overlay__loading > div p {
  width: 7rem;
  color: var(--el-text-color-regular);
}

.loading-overlay__loading-icon {
  padding: 25px;
}

.loading-overlay__loading-icon > * {
  background-color: transparent;
}

.loading-overlay__loading-text {
  width: 100% !important;
}
</style>
