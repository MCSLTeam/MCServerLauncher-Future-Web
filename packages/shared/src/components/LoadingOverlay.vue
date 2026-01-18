<script setup lang="ts">
import { useI18n } from "vue-i18n";
import FancyBackground from "@repo/ui/src/components/misc/FancyBackground.vue";
import { getPlatform, loading, loadingStep } from "../index.ts";
import { watch } from "vue";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import { animatedVisibilityExists } from "@repo/ui/src/utils/internal.ts";

const t = useI18n().t;
const startTime = Date.now();

const { exist } = animatedVisibilityExists(loading, 500);

// 加载非常快直接不播放动画了
watch(loading, (newValue) => {
  if (!newValue && Date.now() - startTime < 500) {
    exist.value = false;
  }
});
</script>

<template>
  <div
    class="loading-overlay"
    :class="{ 'loading-overlay__hidden': !loading }"
    v-if="exist"
  >
    <FancyBackground>
      <div class="loading-overlay__container">
        <div class="loading-overlay__logo">
          <img src="../assets/MCSL.png" alt="" width="84" />
          <div>
            <h1>
              {{ t("shared.app.name.abbr") }} {{ t("shared.app.name.future") }}
              {{ t(`${getPlatform()}.app.name.suffix`) }}
            </h1>
            <h2>{{ t("shared.app.desc") }}</h2>
          </div>
        </div>
        <div class="loading-overlay__loading">
          <Spinner color="text-color-secondary" />
          {{ loadingStep.trim() == "" ? t("ui.loading.default") : loadingStep }}
        </div>
      </div>
    </FancyBackground>
  </div>
</template>

<style scoped lang="scss">
.loading-overlay {
  z-index: 999;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--mcsl-bg-color-main);

  & > div {
    animation: 0.5s ease-in-out 0.25s both fadeIn;
  }
}

.loading-overlay__hidden {
  animation: 0.5s ease-in-out both fadeOut;
}

.loading-overlay__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-md);
}

.loading-overlay__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-xs);

  & > img {
    width: 6rem;
  }

  & > div {
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: var(--mcsl-spacing-2xs);

    & > h1 {
      color: transparent;
      background: linear-gradient(
        45deg,
        var(--mcsl-color-green),
        var(--mcsl-color-blue)
      );
      background-clip: text;
      text-wrap: nowrap;
    }

    & > h2 {
      color: var(--mcsl-text-color-gray);
      font-size: var(--mcsl-font-size-xl);
      font-weight: var(--mcsl-font-weight-base);
      text-wrap: nowrap;
    }

    @media (min-width: 769px) {
      height: 100%;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    & > div {
      align-items: center;
    }
  }
}

.loading-overlay__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-2xs);
  color: var(--mcsl-text-color-gray);
}
</style>
