<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout />
  </div>
</template>

<script setup lang="ts">
import { load } from "@repo/shared/src";
import { useI18n } from "#imports";
import { useLocale } from "@repo/ui/src/utils/stores.ts";

useLocale().injectI18n(useI18n());
load("web");
</script>
