<script setup lang="ts">
import {ref, type Ref} from "vue";
import {useDarkMode, useLocale} from "../utils/uses";
import Page from "../components/page/Page.vue";

const locale = ref(useLocale().localeStorage);
const locales: Ref<{ label: string; value: string }[]> = ref([]);
const messages = useLocale().getMessages()
(async () => {
  for (const locale in messages) {
    const message = messages[locale]
        .default;
    locales.value.push({
      label:
          message["language.name"] + " (" + message["language.country"] + ")",
      value: locale,
    });
  }
})();
</script>

<template>
  <Page>
    <template #breadcrumb>
      <ElBreadcrumbItem>调试</ElBreadcrumbItem>
    </template>
    <ElForm>
      <ElFormItem label="扩散动画（部分浏览器不支持）">
        <ElButton @click="useDarkMode().changeTheme('light', $event)"
        >浅色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('dark', $event)"
        >深色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('auto', $event)"
        >跟随系统
        </ElButton>
      </ElFormItem>
      <ElFormItem label="中心扩散动画（部分浏览器不支持）">
        <ElButton @click="useDarkMode().changeTheme('light')"
        >浅色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('dark')"
        >深色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('auto')"
        >跟随系统
        </ElButton>
      </ElFormItem>
      <ElFormItem label="渐变动画">
        <ElButton @click="useDarkMode().changeTheme('light', undefined, 'fade')"
        >浅色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('dark', undefined, 'fade')"
        >深色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('auto', undefined, 'fade')"
        >跟随系统
        </ElButton>
      </ElFormItem>
      <ElFormItem label="无动画">
        <ElButton @click="useDarkMode().changeTheme('light', undefined, 'none')"
        >浅色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('dark', undefined, 'none')"
        >深色模式
        </ElButton>
        <ElButton @click="useDarkMode().changeTheme('auto', undefined, 'none')"
        >跟随系统
        </ElButton>
      </ElFormItem>
      <ElFormItem v-if="locale" label="语言">
        <ElSelect
            v-model="locale"
            label="语言"
            @change="useLocale().setLocale(locale)"
        >
          <ElOption label="系统默认" value="auto"/>
          <ElOption
              v-for="(item, index) in locales"
              :key="index"
              :label="item.label"
              :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Page>
</template>

<style scoped></style>
