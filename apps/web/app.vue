<script setup lang="ts">
import {loadApp} from "@repo/commons/src/utils/loader";
import {isAprilFoolsDay} from "@repo/commons/src/utils/common";
import {setBeian, setRouter} from "@repo/commons/src/utils/injections.ts";
import {useLocale} from "@repo/commons/src/utils/uses";
import {useAccount} from "~/utils/auth.ts";
import {setDaemonManager} from "@repo/commons/src/utils/daemon/daemons.ts";

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
  await useAccount().init();
  setDaemonManager({
    addDaemon: async (info) => {
      const res: any = await $fetch("/api/daemon/add", {
        method: "POST",
        body: {
          token: useAccount().token,
          info,
        },
      });
      if (res.status != "ok")
        throw res.message
    },
    getDaemonList: async () => {
      const res: any = await $fetch("/api/daemon/list", {
        method: "POST",
        body: {
          token: useAccount().token,
        },
      });
      if (res.status != "ok")
        throw res.message
      return res.data;
    },
    getToken: async (id) => {
      const res: any = await $fetch("/api/daemon/getToken", {
        method: "POST",
        body: {
          token: useAccount().token,
          id,
        },
      });
      if (res.status != "ok")
        throw res.message
      return res.data.token;
    },
    updateDaemon: async (id, info) => {
      const res: any = await $fetch("/api/daemon/update", {
        method: "POST",
        body: {
          token: useAccount().token,
          id,
          info,
        },
      });
      if (res.status != "ok")
        throw res.message
    },
    removeDaemon: async (id) => {
      const res: any = await $fetch("/api/daemon/remove", {
        method: "POST",
        body: {
          token: useAccount().token,
          id,
        },
      });
      if (res.status != "ok")
        throw res.message
    },
  })

  loadingInfo.setMessage("loading.meta")
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
