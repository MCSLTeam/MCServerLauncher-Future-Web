<script setup lang="ts">
import { getLogoSrc } from "../../utils/common";
import FancyBackground from "../../components/FancyBackground.vue";
import { router } from "../../utils/globals";
</script>

<template>
  <div class="done__container">
    <FancyBackground light="7" />
    <div class="done__container-inner">
      <div class="done__logo">
        <img :src="getLogoSrc()" alt="logo" />
        <h1>
          {{ $t("app.name.abbr") }}
          <span>{{ $t("app.name.future") }}</span>
        </h1>
      </div>
      <h1>{{ $t("welcome.done.title") }}</h1>
      <h2>{{ $t("welcome.done.subtitle") }}</h2>
      <ElButton class="done__button" type="primary" @click="router.push('/')">{{
        $t("welcome.done.close")
      }}</ElButton>
    </div>
  </div>
</template>

<style scoped>
.done__container,
.done__container-inner {
  width: 100%;
  height: 100%;
  margin: 0;
}

.done__container-inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.done__container-inner * {
  z-index: 1;
}

.done__logo {
  height: 7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0;
}

.done__logo img {
  height: 5rem;
}

.done__logo h1 {
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
  font-size: 2.5rem;
}

.done__logo h1 span {
  font-weight: bold;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-dark-2)
  );
  background-clip: text;
}

.done__container-inner > h1 {
  font-size: 3.5rem;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-purple)
  );
  background-clip: text;
  margin: 0;
}

.done__container-inner > h2 {
  font-size: 1.5rem;
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-primary);
  margin: 0.5rem;
}

.done__button {
  margin: 1rem;
}
</style>
