<script setup lang="ts">
import { useRoute } from "vue-router";
import { useNavigation, usePageData } from "../../utils/stores.ts";
import NavTabs from "@repo/ui/src/components/navigation/NavTabs.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import SplitButton from "@repo/ui/src/components/button/SplitButton.vue";
import Spinner from "@repo/ui/src/components/progress/Spinner.vue";
import DropdownMenu from "@repo/ui/src/components/overlay/DropdownMenu.vue";
import { useI18n } from "vue-i18n";
import { provide, ref } from "vue";
import NotFound from "../NotFound.vue";
import { buildActionContextmenu, getStatusColor } from "../../utils/utils.ts";

const t = useI18n().t;
const instanceId = useRoute().params.instanceId as string;

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: t("shared.instances.title"),
      path: "/instances",
    },
    {
      label: instanceId,
      path: "/instance/" + instanceId,
    },
  ],
});

const info = ref<any | null | undefined>(undefined);
provide("instance", info);

(async () => {
  // TODO: 数据获取
  info.value = {
    id: instanceId,
    name: "测试实例",
    status: "running",
  };

  if (info.value === null) {
    usePageData().set({
      layout: "none",
      breadcrumbs: [],
    });
    return;
  }

  usePageData().set({
    layout: "dashboard",
    breadcrumbs: [
      {
        label: t("shared.instances.title"),
        path: "/instances",
      },
      {
        label: info.value.name,
        path: "/instance/" + instanceId,
      },
    ],
  });
})();
</script>

<template>
  <div class="instance" v-if="info">
    <div class="instance__header">
      <div>
        <img src="../../assets/img/MCSL.png" alt="" />
        <div>
          <h3>{{ info.name }}</h3>
          <p
            :style="{
              color: `var(--mcsl-color-${getStatusColor(info.status)})`,
            }"
          >
            {{ t("shared.instance.status." + info.status) }}
          </p>
        </div>
      </div>
      <div class="instance__actions-big">
        <Button
          v-if="['stopped', 'crashed'].includes(info.status)"
          type="primary"
          color="primary"
          icon="fa fa-play"
        >
          {{ t("shared.instance.action.start") }}
        </Button>
        <Button
          v-if="['starting', 'running'].includes(info.status)"
          type="primary"
          color="orange"
          icon="fa fa-repeat"
        >
          {{ t("shared.instance.action.restart") }}
        </Button>
        <SplitButton
          v-if="['starting', 'running'].includes(info.status)"
          :dropdown-menu="[
            {
              label: t('shared.instance.action.kill'),
              color: 'red',
              type: 'primary',
            },
          ]"
          type="primary"
          color="red"
          icon="fa fa-stop"
        >
          {{ t("shared.instance.action.stop") }}
        </SplitButton>
        <Button
          v-if="info.status == 'stopping'"
          type="primary"
          color="red"
          icon="fa fa-stop"
        >
          {{ t("shared.instance.action.kill") }}
        </Button>
      </div>
      <div class="instance__actions-small">
        <DropdownMenu
          v-if="info.status != 'installing'"
          :menu="buildActionContextmenu(info)"
        >
          <template #triggerer="{ toggle }">
            <Button rounded type="text" icon="fa fa-ellipsis" @click="toggle" />
          </template>
        </DropdownMenu>
      </div>
    </div>
    <NavTabs :tabs="useNavigation().get('instance').value" />
    <div class="instance__content">
      <RouterView v-slot="{ Component }">
        <transition mode="out-in" name="fade" :duration="250">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>
  </div>
  <NotFound v-else-if="info === null" />
  <div v-else class="instance__loading">
    <Spinner size="large" />
  </div>
</template>

<style scoped lang="scss">
.instance {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
}

.instance__content {
  height: 0;
  flex: 1;
  overflow: hidden auto;
}

.instance__loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.instance__header {
  &,
  & > div {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }

  & > div:first-child {
    width: 0;
    flex: 1;

    & > img {
      width: 3rem;
      background: var(--mcsl-bg-color-main);
      border-radius: var(--mcsl-border-radius-sm);
      border: 1px solid var(--mcsl-border-color-base);
    }

    & > div > h3 {
      margin-bottom: 2px;
    }
  }
}

@media (max-width: 768px) {
  .instance__header .instance__actions-big {
    display: none;
  }
}

@media (min-width: 769px) {
  .instance__header .instance__actions-small {
    display: none;
  }
}
</style>
