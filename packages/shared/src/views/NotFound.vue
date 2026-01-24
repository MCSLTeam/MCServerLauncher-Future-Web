<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePageData } from "../utils/stores.ts";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import FancyBackground from "@repo/ui/src/components/misc/FancyBackground.vue";
import { onMounted, onUnmounted, ref } from "vue";
import router from "../router.ts";

usePageData().set({
  breadcrumbs: [],
  layout: "none",
});

const t = useI18n().t;

const countdown = ref(5);
let interval: any;

function goHome() {
  router.push("/");
}

onMounted(() => {
  interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(interval);
      goHome();
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <FancyBackground>
    <div class="not-found">
      <h1>{{ t("shared.404.title") }}</h1>
      <h3>{{ t("shared.404.subtitle") }}</h3>
      <div>
        <Button @click="router.back">{{ t("shared.404.back") }}</Button>
        <Button type="primary" @click="goHome">{{
          t("shared.404.home", { countdown })
        }}</Button>
      </div>
    </div>
  </FancyBackground>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-4xs);

  & > h3 {
    color: var(--mcsl-text-color-gray);
  }

  & > div {
    margin-top: var(--mcsl-spacing-2xs);
    display: flex;
    gap: var(--mcsl-spacing-xs);
  }
}
</style>
