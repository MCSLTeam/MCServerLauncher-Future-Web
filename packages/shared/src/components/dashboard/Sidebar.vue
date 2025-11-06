<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Divider from "@repo/ui/src/components/misc/Divider.vue";
import { getPlatform } from "../../index.ts";

const t = useI18n().t;
</script>

<template>
  <div class="sidebar">
    <div class="logo">
      <img src="../../assets/MCSL.png" alt="" />
      <div>
        <h3>
          {{ t("shared.app.name.name") }}
        </h3>
        <h2>
          {{ t("shared.app.name.future") }}
          {{ t(`${getPlatform()}.app.name.suffix`) }}
        </h2>
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
          仪表盘
        </Button>
        <Button
          icon="fa fa-server"
          block
          type="text"
          align="left"
          shadow="never"
        >
          实例管理
        </Button>
        <Button
          icon="fa fa-puzzle-piece"
          block
          type="text"
          align="left"
          shadow="never"
        >
          探索资源
        </Button>
        <Button icon="fa fa-user" block type="text" align="left" shadow="never">
          用户管理
        </Button>
        <Button
          icon="fa fa-circle-info"
          block
          type="text"
          align="left"
          shadow="never"
        >
          帮助中心
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
            任务列表
          </Button>
          <Button
            icon="fa fa-desktop"
            block
            type="text"
            align="left"
            shadow="never"
          >
            远程节点
          </Button>
          <Button
            icon="fa fa-cog"
            block
            type="text"
            align="left"
            shadow="never"
          >
            设置
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
  width: 18rem;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--mcsl-spacing-2xs);

  & > img {
    width: 4rem;
  }

  & > div {
    display: flex;
    flex-direction: column;
    justify-content: center;

    & > h3 {
      color: transparent;
      background: linear-gradient(
        45deg,
        var(--mcsl-color-green),
        var(--mcsl-color-blue)
      );
      background-clip: text;
    }

    & > h2 {
      color: transparent;
      background: linear-gradient(
        45deg,
        var(--mcsl-color-blue-500),
        var(--mcsl-color-blue-600)
      );
      background-clip: text;
      font-size: var(--mcsl-font-size-xl);
      font-weight: var(--mcsl-font-weight-base);
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

.sidebar__content-big {
  @extend .sidebar__content;
  flex-grow: 1;
}
</style>
