<script setup lang="ts">
import NotificationTemplate from "@repo/ui/src/components/overlay/notification/NotificationTemplate.vue";
import NotificationOverlay from "@repo/ui/src/components/overlay/notification/NotificationOverlay.vue";
</script>

<template>
  <NotificationTemplate id="default">
    <template v-slot="data">
      <p>{{ (data as any).message }}</p>
    </template>
  </NotificationTemplate>
  <NotificationOverlay />
  <RouterView />
</template>

<style scoped></style>
