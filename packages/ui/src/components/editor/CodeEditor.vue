<script setup lang="ts">
import BaseTextEditor from "./BaseTextEditor.vue";
import { computed, ref } from "vue";
import hljs from "highlight.js";
import DropdownMenu from "../overlay/DropdownMenu.vue";
import { useI18n } from "vue-i18n";
import InputText from "../form/entries/InputText.vue";

const t = useI18n().t;

const props = defineProps<{
  defaultLang?: string | string[];
}>();

const value = defineModel<string>({
  required: false,
  default: "",
});

const editor = ref();

const lang = ref(props.defaultLang);
const langFilter = ref("");
const langDropdown = ref();
const langs = Array.of(undefined, ...hljs.listLanguages()).map((l) => ({
  label: langLabel(l),
  lang: l,
  onClick() {
    lang.value = l;
  },
}));
const filteredLangs = computed(() => {
  if (langFilter.value == "") return langs;
  else
    return langs.filter(
      (l) =>
        searchMatch(l.label, langFilter.value) ||
        searchMatch(l.lang ?? "auto", langFilter.value),
    );
});
function langLabel(lang?: string | string[]) {
  if (lang == undefined || Array.isArray(lang)) return t("ui.editor.lang.auto");
  else return hljs.getLanguage(lang)?.name ?? lang;
}

function searchMatch(a: string, b: string) {
  return a
    .toLowerCase()
    .replaceAll(/[^a-zA-Z0-9]/g, "")
    .includes(b.toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, ""));
}
</script>

<template>
  <div class="mcsl-code-editor">
    <BaseTextEditor v-model="value" ref="editor" :lang="lang" />
    <div
      class="mcsl-code-editor__footer"
      :class="{
        'mcsl-code-editor__footer-shadow': editor?.showFooterShadow ?? false,
      }"
    >
      <div>
        <button class="mcsl-code-editor__footer-btn">文本编辑器</button>
        <DropdownMenu
          ref="langDropdown"
          :menu="filteredLangs"
          :follow-width="false"
          @closed="langFilter = ''"
          default-pos="top"
        >
          <template #triggerer="{ toggle }">
            <button class="mcsl-code-editor__footer-btn" @click="toggle">
              {{ langLabel(lang) }}
            </button>
          </template>
          <template #header>
            <InputText
              v-model="langFilter"
              :placeholder="t('ui.editor.lang.search-placeholder')"
              size="small"
              @input="langDropdown.relocate()"
            />
          </template>
        </DropdownMenu>
      </div>
      <div>
        <button class="mcsl-code-editor__footer-btn">1:1</button>
        <button class="mcsl-code-editor__footer-btn">LF</button>
        <button class="mcsl-code-editor__footer-btn">UTF-8</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-code-editor {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-bottom-left-radius: var(--mcsl-border-radius-sm);
  border-bottom-right-radius: var(--mcsl-border-radius-sm);
}

.mcsl-code-editor > div:first-child {
  height: 0;
  flex: 1;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.mcsl-code-editor__footer {
  z-index: 1;
  height: 1.5rem;
  display: flex;
  justify-content: space-between;
  background: var(--mcsl-bg-color-main);
  border-top: 1px solid var(--mcsl-border-color-base);
  transition: 0.2s ease-in-out;
  overflow: auto hidden;

  & > div {
    display: flex;
  }
}

.light .mcsl-code-editor__footer-shadow {
  box-shadow:
    0 0 6px -1px #0000001a,
    0 0 4px -2px #0000001a;
}

.dark .mcsl-code-editor__footer-shadow {
  box-shadow:
    0 0 6px -1px #ffffff1a,
    0 0 4px -2px #ffffff1a;
}

.mcsl-code-editor__footer-btn {
  height: 100%;
  background: none;
  border: none;
  outline: 0 solid transparent;
  outline-offset: -3px;
  padding: 0 var(--mcsl-spacing-2xs);
  transition: 0.2s ease-in-out;

  &:hover {
    background: var(--mcsl-bg-color-dark);
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}
</style>

<style lang="scss"></style>
