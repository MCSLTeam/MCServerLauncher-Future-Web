<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {type DaemonInfo, daemonList, removeDaemon, updateDaemon} from "../../utils/daemon/daemons.ts";
import {ref} from "vue";
import DaemonConnectDialog from "./DaemonConnectDialog.vue";

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const showEditDialog = ref(false);

const info = daemonList.value[props.id]!

async function update(info: DaemonInfo) {
  await updateDaemon(props.id, info)
}
</script>

<template>
  <ElCard>
    <DaemonConnectDialog v-model:visible="showEditDialog" :edit="info" :save-daemon="update"/>
    <h2>{{ info.name }}</h2>
  </ElCard>
</template>

<style scoped>
</style>
