<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Background from "@repo/ui/src/components/misc/Background.vue";
import { platform } from "../../index.ts";
import { onMounted, ref } from "vue";

const t = useI18n().t;
const exists = ref(true);

onMounted(() => {
  setTimeout(() => (exists.value = false), 2600);
});
</script>

<template>
  <div class="welcome-overlay" v-if="exists">
    <Background>
      <div class="welcome-overlay__logo">
        <img src="../../assets/img/MCSL.png" alt="" />
        <div>
          <h1>
            {{ t("shared.app.name.abbr") }} {{ t("shared.app.name.future") }}
            {{ t(`${platform}.app.name.suffix`) }}
          </h1>
          <h2>{{ t("shared.app.desc") }}</h2>
        </div>
      </div>
    </Background>
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
  animation:
    var(--mcsl-motion-duration-slower) var(--mcsl-motion-ease-exit)
    var(--mcsl-motion-delay-splash) both fadeOut;
}

.welcome-overlay__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-xs);

  & > img {
    width: 7rem;
    animation:
      var(--mcsl-motion-duration-slower) var(--mcsl-motion-ease-emphasized)
      var(--mcsl-motion-delay-base) both zoomIn;
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
      color: var(--mcsl-text-color-secondary);
      font-size: var(--mcsl-font-size-xl);
      font-weight: var(--mcsl-font-weight-base);
      text-wrap: nowrap;
    }

    @media (min-width: 769px) {
      overflow: hidden;
      height: 100%;
      max-width: 0;
      animation:
        calc(var(--mcsl-motion-duration-slower) * 2) var(--mcsl-motion-ease-enter)
        calc(var(--mcsl-motion-delay-longer) - var(--mcsl-motion-duration-instant) / 2)
        both collapseInHorizontal;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    & > div {
      align-items: center;

      & > h1 {
        animation:
          var(--mcsl-motion-duration-slower) var(--mcsl-motion-ease-enter)
          var(--mcsl-motion-delay-long) both fadeInUp;
      }

      & > h2 {
        animation:
          var(--mcsl-motion-duration-slower) var(--mcsl-motion-ease-enter)
          var(--mcsl-motion-delay-longer) both fadeInUp;
      }
    }
  }
}
</style>
