<script setup lang="ts">
import { Checkbox, Panel, Switch } from "@repo/ui";
import { ref } from "vue";

const checked = ref(true);
const enabled = ref(false);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Checkbox and Switch should share density, focus contrast, and calm hover feedback.</p></Panel>
    </template>
  </GalleryDocPage>
</template>
