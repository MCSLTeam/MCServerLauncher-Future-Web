<script setup lang="ts">
import SharedApp from "@repo/shared/src/App.vue";
import TaskExitDialog from "./components/TaskExitDialog.vue";
import UserCenterModal from "./components/userCenter/UserCenterModal.vue";
</script>

<template>
  <SharedApp />
  <UserCenterModal />
  <TaskExitDialog />
</template>

<style scoped lang="scss"></style>
