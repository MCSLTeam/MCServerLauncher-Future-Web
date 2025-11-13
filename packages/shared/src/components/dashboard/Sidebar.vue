<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import {
  windowButtonTransition,
  getPlatform,
  windowButtonsExists,
} from "../../index.ts";
import { useRouter } from "vue-router";
import { computed } from "vue";

defineProps<{
  collapsed: boolean;
}>();

const t = useI18n().t;
const platform = getPlatform();
const router = useRouter();
const currentPath = computed(() => router.currentRoute.value.fullPath);
</script>

<template>
  <div class="sidebar" :class="{ sidebar__collapsed: collapsed }">
    <div
      class="logo"
      :class="[`logo-${platform}`]"
      :style="{
        marginTop: windowButtonsExists
          ? `calc(var(--mcsl-spacing-xs) + 2 * var(--mcsl-spacing-md) + 1rem)`
          : `var(--mcsl-spacing-xl)`,
        transition: `margin-top ${windowButtonTransition}`,
      }"
    >
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
          :class="{ 'sidebar__btn-selected': currentPath == '/dashboard' }"
          icon="fa fa-dashboard"
          block
          type="text"
          align="left"
          shadow="never"
          :color="currentPath == '/dashboard' ? 'primary' : undefined"
          @click="router.push('/dashboard')"
        >
          {{ t("shared.dashboard.title") }}
        </Button>
        <Button
          :class="{ 'sidebar__btn-selected': currentPath == '/instances' }"
          icon="fa fa-server"
          block
          type="text"
          align="left"
          shadow="never"
          :color="currentPath == '/instances' ? 'primary' : undefined"
          @click="router.push('/instances')"
        >
          {{ t("shared.instances.title") }}
        </Button>
        <Button
          :class="{
            'sidebar__btn-selected': currentPath == '/resource-center',
          }"
          icon="fa fa-puzzle-piece"
          block
          type="text"
          align="left"
          shadow="never"
          :color="currentPath == '/resource-center' ? 'primary' : undefined"
          @click="router.push('/resource-center')"
        >
          {{ t("shared.resource-center.title") }}
        </Button>
        <!--        <Button-->
        <!--          :class="{ 'sidebar__btn-selected': currentPath == '/users' }"-->
        <!--          icon="fa fa-user"-->
        <!--          block-->
        <!--          type="text"-->
        <!--          align="left"-->
        <!--          shadow="never"-->
        <!--          :color="currentPath == '/users' ? 'primary' : undefined"-->
        <!--          @click="router.push('/users')"-->
        <!--        >-->
        <!--          {{ t("web.users.title") }}-->
        <!--        </Button>-->
        <Button
          :class="{ 'sidebar__btn-selected': currentPath == '/help-center' }"
          icon="fa fa-circle-info"
          block
          type="text"
          align="left"
          shadow="never"
          :color="currentPath == '/help-center' ? 'primary' : undefined"
          @click="router.push('/help-center')"
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
            :class="{ 'sidebar__btn-selected': currentPath == '/nodes' }"
            icon="fa fa-desktop"
            block
            type="text"
            align="left"
            shadow="never"
            :color="currentPath == '/nodes' ? 'primary' : undefined"
            @click="router.push('/nodes')"
          >
            {{ t("shared.nodes.title") }}
          </Button>
          <Button
            :class="{ 'sidebar__btn-selected': currentPath == '/settings' }"
            icon="fa fa-cog"
            block
            type="text"
            align="left"
            shadow="never"
            :color="currentPath == '/settings' ? 'primary' : undefined"
            @click="router.push('/settings')"
          >
            {{ t("shared.settings.title") }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@repo/ui/src/assets/css/utils";

.sidebar {
  margin: var(--mcsl-spacing-xl);
  margin-top: 0;
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
  --suffix-color-1: var(--mcsl-color-sky);
  --suffix-color-2: var(--mcsl-color-blue-600);
}

.logo-app {
  --suffix-color-1: var(--mcsl-color-amber-400);
  --suffix-color-2: var(--mcsl-color-red);
}

.sidebar__content-big {
  @extend .sidebar__content;
  flex-grow: 1;
}

.sidebar__collapsed {
  width: 4rem;
}

.sidebar__btn-selected {
  background: utils.transparent(var(--mcsl-color-primary), 10%);
}
</style>
