<script setup lang="ts">
import type { ColorType } from "../../utils/css";
import Message from "./Message.vue";

withDefaults(
  defineProps<{
    title?: string;
    color?: ColorType;
    closable?: boolean;
  }>(),
  {
    title: "",
    color: "primary",
    closable: false,
  },
);
</script>

<template>
  <Message :title="title" :color="color" :closeable="closable" variant="outlined">
    <slot />
  </Message>
</template>
