<script setup lang="ts">
import type { ColorType } from "../../utils/css";
import Message from "../misc/Message.vue";

withDefaults(defineProps<{ title?: string; color?: ColorType }>(), { title: "", color: "warning" });
</script>

<template>
  <Message :title="title" :color="color" variant="default" shadow>
    <slot />
  </Message>
</template>
