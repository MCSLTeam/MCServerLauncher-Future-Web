<script setup lang="ts">
import { showUserCenterModal, userCenterPage } from "../../index.ts";
import Modal from "@repo/ui/src/components/overlay/Modal.vue";
import Sidebar from "@repo/ui/src/components/navigation/Sidebar.vue";
import { useAccount, useWebNavigation } from "../../utils/store.ts";
import { useI18n } from "vue-i18n";

const t = useI18n().t;
const sidebar = useWebNavigation().get("userCenter");

useAccount().updateSelfInfo();

sidebar.value[0]!.onClick!();
</script>

<template>
  <Modal
    v-model:visible="showUserCenterModal"
    :header="t('web.user-center.title')"
    max-width="800px"
    @close="sidebar[0]!.onClick"
  >
    <div class="user-center__body">
      <Sidebar :pages="sidebar" />
      <transition
        v-if="userCenterPage"
        mode="out-in"
        name="stretch-vertical"
        :duration="500"
      >
        <component :is="userCenterPage[1]" />
      </transition>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.user-center__body {
  display: flex;
  gap: var(--mcsl-spacing-sm);

  @media (max-width: 768px) {
    flex-direction: column;
  }

  & > div:first-child {
    width: 13rem;
    padding-right: var(--mcsl-spacing-sm);
    border-right: 1px solid var(--mcsl-border-color-base);

    @media (max-width: 768px) {
      width: 100%;
      padding-right: 0;
      border-right: none;
      padding-bottom: var(--mcsl-spacing-2xs);
      border-bottom: 1px solid var(--mcsl-border-color-base);
    }
  }

  & > div:last-child {
    width: 0;
    flex: 1;

    @media (max-width: 768px) {
      width: 100%;
    }
  }
}
</style>
