<script setup lang="ts">
import FancyBackground from "@repo/ui/src/components/misc/FancyBackground.vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { useI18n } from "vue-i18n";
import { getPlatform } from "../index.ts";

const t = useI18n().t;
</script>

<template>
  <FancyBackground>
    <div class="logo">
      <img src="../assets/MCSL.png" alt="" />
      <h1>
        {{ t("shared.app.name.abbr") }} {{ t("shared.app.name.future") }}
        {{ t(`${getPlatform()}.app.name.suffix`) }}
      </h1>
      <h2>{{ t("shared.app.desc") }}</h2>
    </div>
    <Panel class="auth-panel" body-class="auth-body">
      <RouterView v-slot="{ Component }">
        <transition mode="out-in" name="fade" :duration="250">
          <component :is="Component" />
        </transition>
      </RouterView>
    </Panel>
  </FancyBackground>
</template>

<style scoped lang="scss">
.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-2xs);
  margin-bottom: var(--mcsl-spacing-2xl);
  opacity: 0;
  animation: 0.5s ease-in-out both 0.25s fadeInUp;

  & > img {
    width: 7rem;
  }

  & > h1 {
    color: transparent;
    margin-top: var(--mcsl-spacing-2xs);
    background: linear-gradient(
      45deg,
      var(--mcsl-color-green),
      var(--mcsl-color-blue)
    );
    background-clip: text;
  }

  & > h2 {
    color: var(--mcsl-text-color-gray);
    font-size: var(--mcsl-font-size-xl);
    font-weight: var(--mcsl-font-weight-base);
  }
}

.auth-panel {
  width: min(30rem);
  opacity: 0;
  animation: 0.5s ease-in-out both 0.5s fadeIn;

  @media (max-width: 768px) {
    width: calc(100% - 2 * var(--mcsl-spacing-lg) - 2 * var(--mcsl-spacing-md));
  }
}
</style>

<style lang="scss">
.auth-body > h2 {
  margin-top: var(--mcsl-spacing-xs);
}
</style>
