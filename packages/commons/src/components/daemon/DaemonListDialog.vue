<script setup lang="ts">
import {addDaemon, canHideDaemonList, showDaemonList} from "../../utils/daemon/daemons.js";
import {useI18n} from "vue-i18n";
import DaemonConnectDialog from "./DaemonConnectDialog.vue";
import {ref} from "vue";

const i18n = useI18n();

const showDaemonConnect = ref(false);
</script>

<template>
  <ElDialog v-model="showDaemonList" :title="i18n.t('sidebar.daemon')" width="800px"
            :close-on-press-escape="canHideDaemonList" :close-on-click-modal="canHideDaemonList"
            :show-close="canHideDaemonList">
    <DaemonConnectDialog v-model:visible="showDaemonConnect" :save-daemon="addDaemon"/>
    <div v-if="!canHideDaemonList" class="daemon-list__empty">
      <ElEmpty :description="i18n.t('daemon.list.empty')"/>
      <ElButton type="primary" @click="showDaemonConnect = true">{{ i18n.t('daemon.connect.title') }}</ElButton>
    </div>
  </ElDialog>
</template>

<style scoped>
.daemon-list__empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.daemon-list__empty > .el-empty {
  padding-bottom: 10px;
}
</style>
