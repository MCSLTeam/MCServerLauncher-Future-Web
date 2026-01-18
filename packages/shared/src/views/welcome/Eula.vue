<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePageData } from "../../utils/stores.ts";
import { renderMd } from "@repo/ui/src/utils/render.ts";
import { onMounted, onUnmounted, ref, watch } from "vue";
import axios from "axios";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import router, { firstLoad } from "../../router.ts";
import { close } from "../../index.ts";
import Button from "@repo/ui/src/components/form/button/Button.vue";

usePageData().set({
  breadcrumbs: [],
  layout: "setup",
});

const t = useI18n().t;
const eula = ref<string>();

(async () => {
  try {
    eula.value = (
      await axios.get(t("shared.eula.url"), { timeout: 5000 })
    ).data;
  } catch {
    console.warn("Failed to fetch EULA content from GitHub, using mirror");
    try {
      eula.value = (
        await axios.get(t("shared.eula.mirror"), { timeout: 5000 })
      ).data;
    } catch {
      console.warn("Failed to fetch EULA content from mirror, using default");
      eula.value = t("shared.eula.content");
    }
  }
  eula.value = eula.value?.replace(/^---[\s\S]*?---\s*/, "");
})();

function acceptEula() {
  firstLoad.value = false;
  router.push("/");
}

const countdown = ref(10);
let interval: any;
function startCountdown() {
  interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}

onMounted(() => {
  if (eula.value == undefined) {
    watch(eula, (value) => {
      if (value) {
        startCountdown();
      }
    });
  } else startCountdown();
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div class="welcome-setup">
    <h2>{{ t("shared.eula.title") }}</h2>
    <div class="eula-content">
      <div
        v-if="eula"
        class="mcsl-typography"
        v-html="renderMd(eula, { html: false })"
      />
      <div v-else class="spinner">
        <Spinner />
      </div>
    </div>
    <div class="eula-actions">
      <Button @click="router.push('/welcome/setup')">{{
        t("ui.common.prev-step")
      }}</Button>
      <Button @click="close">{{ t("shared.eula.reject") }}</Button>
      <Button
        type="primary"
        color="primary"
        :disabled="countdown > 0"
        @click="acceptEula"
        >{{
          countdown > 0
            ? t("shared.eula.accept.countdown", { time: countdown })
            : t("shared.eula.accept.normal")
        }}</Button
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.welcome-setup {
  width: min(60rem, 70vw);
  max-height: 30rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  gap: var(--mcsl-spacing-xs);

  & > Button {
    align-self: flex-end;
  }

  @media (max-width: 450px) {
    width: 100%;
  }
}

.eula-content {
  flex-shrink: 2;
  overflow: auto;
  padding: var(--mcsl-spacing-xs);
  background: var(--mcsl-bg-color-main);
  border-radius: var(--mcsl-border-radius-md);
  & > .spinner {
    height: 6rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 450px) {
    height: 100%;
  }
}

.eula-actions {
  display: flex;
  gap: var(--mcsl-spacing-xs);
  justify-content: flex-end;
}
</style>
