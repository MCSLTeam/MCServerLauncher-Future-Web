<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePageData } from "../../utils/stores.ts";
import router from "../../router.ts";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Select from "@repo/ui/src/components/form/entries/Select.vue";
import SelectButton from "@repo/ui/src/components/form/entries/SelectButton.vue";
import FormItem from "@repo/ui/src/components/form/FormItem.vue";
import {
  type Locale,
  type Theme,
  useLocale,
  useTheme,
} from "@repo/ui/src/utils/stores.ts";
import { computed } from "vue";
import * as yup from "yup";
import WelcomeOverlay from "../../components/overlay/WelcomeOverlay.vue";

usePageData().set({
  breadcrumbs: [],
  layout: "setup",
});

const t = useI18n().t;

const theme = computed({
  get() {
    return useTheme().theme;
  },
  set(theme: string) {
    useTheme().change(theme as Theme, "viewTransition");
  },
});
const themes = computed(() => [
  { label: t("shared.settings.appearance.theme.system"), value: "system" },
  { label: t("shared.settings.appearance.theme.light"), value: "light" },
  { label: t("shared.settings.appearance.theme.dark"), value: "dark" },
]);

const messages = useLocale().getMessages();
const locale = computed({
  get() {
    return useLocale().locale;
  },
  set(locale: Locale) {
    useLocale().setLocale(locale);
  },
});
const locales = computed(() => [
  { label: t("shared.settings.general.locale.system"), value: "system" },
  ...Object.keys(messages).map((key) => ({
    label:
      messages[key as Locale]["language"]["name"] +
      " (" +
      messages[key as Locale]["language"]["country"] +
      ")",
    value: key,
  })),
]);
</script>

<template>
  <div class="welcome-setup">
    <WelcomeOverlay />
    <h2>{{ t("shared.welcome.settings") }}</h2>
    <FormItem
      v-model="theme"
      :schema="
        yup
          .string()
          .oneOf(themes.map((item) => item.value))
          .label(t('shared.settings.appearance.theme.label'))
      "
    >
      <SelectButton :options="themes" />
    </FormItem>
    <FormItem
      v-model="locale"
      :schema="
        yup
          .string()
          .oneOf(locales.map((item) => item.value))
          .label(t('shared.settings.general.locale.label'))
      "
    >
      <Select :options="locales" />
    </FormItem>
    <Button type="primary" color="primary" @click="router.push('/welcome/eula')"
      >{{ t("ui.common.next-step") }}
    </Button>
  </div>
</template>

<style scoped lang="scss">
.welcome-setup {
  width: min(30rem, 70vw);
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-xs);

  & > Button {
    align-self: flex-end;
  }

  @media (max-width: 450px) {
    width: 100%;
  }
}
</style>
