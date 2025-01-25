<script setup lang="ts">
import {loadApp} from "@repo/commons/src/utils/loader";
import {isAprilFoolsDay} from "@repo/commons/src/utils/common";
import {setBeian, setRouter} from "@repo/commons/src/utils/injections.ts";
import {useLocale} from "@repo/commons/src/utils/uses";
import {initDatabase} from "~/utils/db.ts";

let siteName = "MCSL Future Web";

useHead({
  titleTemplate: (titleChunk) =>
      titleChunk ? `${titleChunk} | ` + siteName : siteName,
  link: [
    {
      // 图标
      rel: "icon",
      type: "image/png",
      href: isAprilFoolsDay() // 判断愚人节，使用愚人节图标
          ? "/assets/img/favicon-aprilfools.png"
          : "/assets/img/favicon.png",
    },
  ],
});

// 加载
useLocale().injectI18n(useI18n());
loadApp(async (loadingInfo) => {
  loadingInfo.setMessage("loading.default");
  setRouter(useRouter());
  await initDatabase();
  const meta = (await $fetch("/api/getMeta")).data;
  siteName = meta.siteName;
  setBeian(meta.beian);
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage/>
  </NuxtLayout>
</template>

<style scoped></style>
