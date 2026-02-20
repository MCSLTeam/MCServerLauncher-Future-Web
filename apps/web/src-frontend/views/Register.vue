<script setup lang="ts">
import Button from "@repo/ui/src/components/button/Button.vue";
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
import { setShouldRegister } from "../index.ts";

usePageData().set({
  breadcrumbs: [],
  layout: "setup",
});

const t = useI18n().t;

const form = createForm(
  {
    username: "",
    password: "",
    passwordConfirm: "",
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
    passwordConfirm: yup
      .string()
      .label(t("web.auth.password-confirm.label"))
      .oneOf([yup.ref("password")], t("web.auth.password-confirm.invalid"))
      .required(),
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
    await requestApi(
      "/account/register",
      "POST",
      (e) => notifyErr(e, "web.auth.register.error"),
      {
        username: form.data.value.username,
        password: form.data.value.password,
      },
    );

    setShouldRegister(false);

    new MCSLNotif({
      data: {
        color: "success",
        title: t("ui.notification.title.success"),
        message: t("web.auth.register.success"),
      },
    }).open();

    await router.push({
      path: "/auth/login",
      query: {
        username: form.data.value.username,
        password: form.data.value.password,
      },
    });
  } finally {
    canSubmit = true;
  }
}
</script>

<template>
  <div class="register">
    <h2>{{ t("web.auth.register.title") }}</h2>
    <Form :form="form" @submit="submit">
      <FormEntry name="username">
        <InputText :placeholder="t('web.auth.username.format')" />
      </FormEntry>
      <FormEntry name="password">
        <InputText :placeholder="t('web.auth.password.format')" password />
      </FormEntry>
      <FormEntry name="passwordConfirm">
        <InputText
          :placeholder="t('web.auth.password-confirm.placeholder')"
          password
        />
      </FormEntry>
      <Button block type="primary" color="primary" btn-type="submit">
        {{ t("web.auth.register.submit") }}
      </Button>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.register {
  width: min(30rem, 70vw);

  @media (max-width: 450px) {
    width: 100%;
  }

  & > h2 {
    margin-bottom: var(--mcsl-spacing-2xs);
  }
}
</style>
