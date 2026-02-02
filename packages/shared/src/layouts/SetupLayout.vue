<script setup lang="ts">
import FancyBackground from "@repo/ui/src/components/misc/FancyBackground.vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { useI18n } from "vue-i18n";
import { platform } from "../index.ts";

const t = useI18n().t;
</script>

<template>
  <FancyBackground>
    <div class="logo">
      <img src="../assets/img/MCSL.png" alt="" width="98" />
      <h1>
        {{ t("shared.app.name.abbr") }} {{ t("shared.app.name.future") }}
        {{ t(`${platform}.app.name.suffix`) }}
      </h1>
      <h2>{{ t("shared.app.desc") }}</h2>
    </div>
    <Panel class="auth-panel" body-class="auth-body">
      <RouterView v-slot="{ Component }">
        <transition mode="out-in" name="stretch" :duration="500">
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
  max-height: calc(
    100% - 2 * var(--mcsl-spacing-lg) - 174px - var(--mcsl-spacing-2xl) - 2 *
      var(--mcsl-spacing-md)
  );

  @media (min-width: 451px) {
    max-width: 70vw;
  }

  @media (max-width: 450px) {
    width: calc(100% - 2 * var(--mcsl-spacing-lg) - 2 * var(--mcsl-spacing-md));
  }
}

.stretch-enter-active {
  transition: 1s cubic-bezier(0, 1, 0, 1);
  overflow: hidden;
}

.stretch-leave-active {
  transition: 0.5s ease-in-out;
  overflow: hidden;
}

.stretch-enter-from,
.stretch-leave-to {
  max-width: 0 !important;
  max-height: 0 !important;
  opacity: 0;
}

.stretch-enter-to,
.stretch-leave-from {
  max-width: 999px;
  max-height: 999px;
  opacity: 1;
}
</style>

<style lang="scss">
.auth-body > h2 {
  margin-top: var(--mcsl-spacing-xs);
}
</style>
