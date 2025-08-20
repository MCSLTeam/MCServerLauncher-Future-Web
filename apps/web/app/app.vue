<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout />
  </div>
</template>

<script setup lang="ts">
import { load } from "@repo/shared/src";
import { useI18n } from "#imports";

load(useI18n());
</script>
