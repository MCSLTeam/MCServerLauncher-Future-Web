<script setup lang="ts">
import { notifications } from "../../../utils/notifications.ts";
import Message from "../../panel/Message.vue";
</script>

<template>
  <div class="mcsl-notifications">
    <Message
      v-for="(item, id) in notifications"
      :key="id"
      v-bind="{
        closeable: true,
        shadow: true,
        inAnim: 'fadeInRight',
        outAnim: 'fadeOut',

        ...item.template.props(item.settings.data),
      }"
      :visible="item.isMcsl && (item.opened as any)"
    >
      <component :is="item.element" />
    </Message>
  </div>
</template>

<style scoped lang="scss">
.mcsl-notifications {
  width: 20rem;
  position: fixed;
  top: var(--mcsl-spacing-md);
  right: var(--mcsl-spacing-md);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--mcsl-spacing-xs);
  transition: 0.2s ease-in-out;
  z-index: 9999;

  @media (max-width: 20rem) {
    width: calc(100% - var(--mcsl-spacing-md) * 2);
  }
}
</style>
