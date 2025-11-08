<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import { getPlatform } from "../../index.ts";

const t = useI18n().t;
const platform = getPlatform();
</script>

<template>
  <div class="sidebar">
    <div class="logo" :class="[`logo-${platform}`]">
      <img src="../../assets/MCSL.png" alt="" />
      <div>
        <h2>
          {{ t("shared.app.name.name") }}
        </h2>
        <h3>
          {{ t("shared.app.name.future") }}
          {{ t(`${platform}.app.name.suffix`) }}
        </h3>
      </div>
    </div>
    <Divider spacing="md" />
    <div class="sidebar__content-big">
      <div>
        <Button
          icon="fa fa-dashboard"
          block
          type="text"
          align="left"
          shadow="never"
        >
          {{ t("shared.dashboard.title") }}
        </Button>
        <Button
          icon="fa fa-server"
          block
          type="text"
          align="left"
          shadow="never"
        >
          {{ t("shared.instances.title") }}
        </Button>
        <Button
          icon="fa fa-puzzle-piece"
          block
          type="text"
          align="left"
          shadow="never"
        >
          {{ t("shared.resource-center.title") }}
        </Button>
        <Button icon="fa fa-user" block type="text" align="left" shadow="never">
          {{ t("shared.users.title") }}
        </Button>
        <Button
          icon="fa fa-circle-info"
          block
          type="text"
          align="left"
          shadow="never"
        >
          {{ t("shared.help-center.title") }}
        </Button>
      </div>
      <div class="sidebar__content">
        <div>
          <Divider spacing="md" />
          <Button
            icon="fa fa-list-check"
            block
            type="text"
            align="left"
            shadow="never"
          >
            {{ t("shared.tasks.title") }}
          </Button>
          <Button
            icon="fa fa-desktop"
            block
            type="text"
            align="left"
            shadow="never"
          >
            {{ t("shared.nodes.title") }}
          </Button>
          <Button
            icon="fa fa-cog"
            block
            type="text"
            align="left"
            shadow="never"
          >
            {{ t("shared.settings.title") }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  margin: var(--mcsl-spacing-xl);
  margin-right: 0;
  width: 16rem;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--mcsl-spacing-2xs);

  & > img {
    width: 3rem;
  }

  & > div {
    display: flex;
    flex-direction: column;
    justify-content: center;

    & > h2 {
      color: transparent;
      background: linear-gradient(
        45deg,
        var(--mcsl-color-green),
        var(--mcsl-color-blue)
      );
      font-size: var(--mcsl-font-size-lg);
      font-weight: var(--mcsl-font-weight-bold);
      background-clip: text;
    }

    & > h3 {
      color: transparent;
      background: linear-gradient(
        135deg,
        var(--suffix-color-1),
        var(--suffix-color-2)
      );
      background-clip: text;
      font-size: var(--mcsl-font-size-xl);
    }
  }
}

.sidebar__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: var(--mcsl-spacing-4xs);

  & > div {
    width: 100%;
  }
}

.logo-web {
  --suffix-color-1: var(--mcsl-color-sky-500);
  --suffix-color-2: var(--mcsl-color-blue-600);
}

.logo-app {
  --suffix-color-1: var(--mcsl-color-amber-400);
  --suffix-color-2: var(--mcsl-color-red-500);
}

.sidebar__content-big {
  @extend .sidebar__content;
  flex-grow: 1;
}
</style>
