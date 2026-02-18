<script setup lang="ts">
import {
  addTemplate,
  MCSLNotif,
  removeTemplate,
} from "../../../utils/notifications.ts";
import { onMounted, onUnmounted, type VueElement } from "vue";
import type { MessageProps } from "../../misc/Message.vue";

const props = withDefaults(
  defineProps<{
    id: string;
    props?: (notif: MCSLNotif) => MessageProps;
    systemNotif?: (notif: MCSLNotif) => { title: string; body: string };
  }>(),
  {
    props: (notif: MCSLNotif) => notif.settings.data,
    systemNotif: (notif: MCSLNotif) => ({
      title: notif.settings.data.title,
      body: notif.settings.data.message,
    }),
  },
);

const slots = defineSlots<{
  default(props: MCSLNotif): VueElement[];
}>();

onMounted(() => {
  addTemplate(props.id, props.props, props.systemNotif, slots.default);
});

onUnmounted(() => {
  removeTemplate(props.id);
});
</script>

<template></template>
