<script setup lang="ts">
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Checkbox from "@repo/ui/src/components/form/entries/Checkbox.vue";
import { createForm } from "@repo/ui/src/utils/form.ts";
import * as yup from "yup";
import Form from "@repo/ui/src/components/form/Form.vue";
import FormEntry from "@repo/ui/src/components/form/FormEntry.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import { usePageData } from "@repo/shared/src/utils/stores.ts";
import { useI18n } from "vue-i18n";
import { notifyErr, requestApi } from "../utils/network.ts";
import router from "@repo/shared/src/router.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { useRoute } from "vue-router";
import { type TokenPair, useAccount } from "../utils/store.ts";

usePageData().set({
  breadcrumbs: [],
  layout: "setup",
});

const t = useI18n().t;

const form = createForm(
  {
    username: (useRoute().query.username as string) ?? "",
    password: (useRoute().query.password as string) ?? "",
    remember: false,
  },
  yup.object({
    username: yup
      .string()
      .min(2)
      .max(16)
      .label(t("web.auth.username.label"))
      .required(),
    password: yup
      .string()
      .label(t("web.auth.password.label"))
      .min(8)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        t("web.auth.password.invalid"),
      )
      .required(),
    remember: yup.boolean().label(t("web.auth.remember")),
  }),
  "input",
);

let canSubmit = true;

async function submit() {
  if (!canSubmit) {
    return;
  }
  canSubmit = false;

  try {
    const tokenPair = await requestApi<TokenPair>(
      "/account/login",
      "POST",
      (e) => notifyErr(e, "web.auth.login.error"),
      form.data.value,
    );

    await useAccount().setToken(tokenPair, form.data.value.remember);

    await router.push("/");

    new MCSLNotif({
      data: {
        color: "success",
        title: t("ui.notification.title.success"),
        message: t("web.auth.login.success"),
      },
    }).open();
  } catch {
    canSubmit = true;
  }
}
</script>

<template>
  <div class="login">
    <h2>{{ t("web.auth.login.title") }}</h2>
    <Form :form="form" @submit="submit">
      <FormEntry name="username">
        <InputText :placeholder="t('web.auth.username.placeholder')" />
      </FormEntry>
      <FormEntry name="password">
        <InputText :placeholder="t('web.auth.password.placeholder')" password />
      </FormEntry>
      <FormEntry name="remember" entry-pos="left">
        <Checkbox />
      </FormEntry>
      <Button block type="primary" color="primary" btn-type="submit">
        {{ t("web.auth.login.submit") }}
      </Button>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.login {
  width: min(30rem, 70vw);

  @media (max-width: 450px) {
    width: 100%;
  }
}
</style>
