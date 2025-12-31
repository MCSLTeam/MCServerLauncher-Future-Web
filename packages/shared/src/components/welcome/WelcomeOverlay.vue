<script setup lang="ts">
import { useI18n } from "vue-i18n";
import FancyBackground from "@repo/ui/src/components/misc/FancyBackground.vue";
import { getPlatform } from "../../index.ts";

const t = useI18n().t;
</script>

<template>
  <div class="welcome-overlay">
    <FancyBackground>
      <div class="welcome-overlay__logo">
        <img src="../../assets/MCSL.png" alt="" width="98" />
        <div>
          <h1>
            {{ t("shared.app.name.abbr") }} {{ t("shared.app.name.future") }}
            {{ t(`${getPlatform()}.app.name.suffix`) }}
          </h1>
          <h2>{{ t("shared.app.desc") }}</h2>
        </div>
      </div>
    </FancyBackground>
  </div>
</template>

<style scoped lang="scss">
.welcome-overlay {
  z-index: 1000;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--mcsl-bg-color-main);
  animation: 0.5s ease-in-out 3s both welcome-overlay__out-anim;
}

.welcome-overlay__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-xs);

  & > img {
    width: 7rem;
    animation: 0.5s ease-in-out 0.5s both zoomIn;
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
      overflow: hidden;
      height: 100%;
      max-width: 0;
      animation: 1s ease-in-out 1s both collapseInHorizontal;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    & > div {
      align-items: center;

      & > h1 {
        animation: 0.5s ease-in-out 1s both fadeInUp;
      }

      & > h2 {
        animation: 0.5s ease-in-out 1.25s both fadeInUp;
      }
    }
  }
}

@keyframes welcome-overlay__out-anim {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
