<script setup lang="ts">
import Layout from "@repo/commons/src/Layout.vue";
import {layout} from "./router.ts";
import {useLocale} from "@repo/commons/src/utils/uses";
import {useI18n} from "vue-i18n";
import WindowButton from "./components/WindowButton.vue";

useLocale().injectComposer(useI18n())
</script>

<template>
  <div class="app__container">
    <WindowButton/>
    <Layout v-if="layout == 'default'">
      <router-view v-slot="{ Component, route }">
        <transition name="blur" mode="out-in">
          <component :is="Component" :key="route.path"/>
        </transition>
      </router-view>
    </Layout>
    <router-view v-else-if="layout == 'none'" v-slot="{ Component, route }">
      <transition name="blur" mode="out-in">
        <component :is="Component" :key="route.path"/>
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.app__container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tauri-macos .app__container {
  margin-top: 8px;
  height: calc(100% - 8px);
}
</style>