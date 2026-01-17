<script setup lang="ts">
import { addTemplate, removeTemplate } from "../../../utils/notifications.ts";
import { onMounted, onUnmounted, type VueElement } from "vue";
import type { MessageProps } from "../../panel/Message.vue";

const props = withDefaults(
  defineProps<{
    id: string;
    props?: (data: any) => MessageProps;
    systemNotif?: (
      data: any,
    ) => { title: string; body: string };
  }>(),
  {
    props: (data: any) => data,
    systemNotif: (data: any) => ({ title: data.title, body: data.message }),
  },
);

const slots = defineSlots<{
  default(props: any): VueElement[];
}>();

onMounted(() => {
  addTemplate(props.id, props.props, props.systemNotif, slots.default);
});

onUnmounted(() => {
  removeTemplate(props.id);
});
</script>

<template></template>
