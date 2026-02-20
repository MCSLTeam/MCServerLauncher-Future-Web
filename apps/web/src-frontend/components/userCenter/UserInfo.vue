<script setup lang="ts">
import { useI18n } from "vue-i18n";
import * as yup from "yup";
import { createForm } from "@repo/ui/src/utils/form.ts";
import Form from "@repo/ui/src/components/form/Form.vue";
import FormEntry from "@repo/ui/src/components/form/FormEntry.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import Button from "@repo/ui/src/components/button/Button.vue";
import { notifyErr, requestWithToken } from "../../utils/network.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { useAccount } from "../../utils/store.ts";
import dayjs from "dayjs";
import { formatDate } from "@repo/ui/src/utils/utils.ts";
import { ref } from "vue";
import ConfirmModal from "@repo/shared/src/components/ConfirmModal.vue";

const t = useI18n().t;
const showClearSessionsConfirm = ref(false);
const showLogoutConfirm = ref(false);

const form = createForm(
  {
    old_password: "",
    password: "",
    passwordConfirm: "",
  },
  yup.object({
    old_password: yup
      .string()
      .label(t("web.user-center.password-reset.old-password.label"))
      .min(8)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        t("web.user-center.password-reset.old-password.invalid"),
      )
      .required(),
    password: yup
      .string()
      .label(t("web.user-center.password-reset.new-password.label"))
      .min(8)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        t("web.user-center.password-reset.new-password.invalid"),
      )
      .notOneOf(
        [yup.ref("old_password")],
        t("web.user-center.password-reset.new-password.same-as-old"),
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
    await requestWithToken(
      "/user/password",
      "PUT",
      (e) => notifyErr(e, "web.user-center.password-reset.error"),
      form.data.value,
    );

    new MCSLNotif({
      data: {
        color: "success",
        title: t("ui.notification.title.success"),
        message: t("web.user-center.password-reset.success"),
      },
    }).open();
  } finally {
    canSubmit = true;
  }
}

async function clearSessions() {
  await requestWithToken<void>("/session/self", "DELETE", (e) =>
    notifyErr(e, "web.user-center.sessions.clear.error"),
  );

  new MCSLNotif({
    data: {
      color: "success",
      title: t("ui.notification.title.success"),
      message: t("web.user-center.sessions.clear.success"),
    },
  }).open();

  await useAccount().logout(false);
}
</script>

<template>
  <div class="user-info">
    <ConfirmModal
      v-model:visible="showClearSessionsConfirm"
      :title="t('web.user-center.sessions.clear.confirm')"
      @confirm="clearSessions"
    />
    <ConfirmModal
      v-model:visible="showLogoutConfirm"
      :title="t('web.auth.logout.confirm')"
      @confirm="useAccount().logout"
    />
    <div>
      <h3>{{ t("web.user-center.user-info.title") }}</h3>
      <div class="user-info__info">
        <p>{{ t("web.user-center.user-info.username") }}</p>
        <strong>{{ useAccount().selfInfo.username }}</strong>
        <p>{{ t("web.user-center.user-info.created-at") }}</p>
        <strong>{{
          formatDate(dayjs(useAccount().selfInfo.created_at))
        }}</strong>
      </div>
    </div>
    <div>
      <h3>{{ t("web.user-center.password-reset.title") }}</h3>
      <Form :form="form" @submit="submit">
        <FormEntry name="old_password">
          <InputText
            :placeholder="
              t('web.user-center.password-reset.old-password.placeholder')
            "
            password
          />
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
          {{ t("web.user-center.password-reset.submit") }}
        </Button>
      </Form>
    </div>
    <div>
      <h3>{{ t("web.user-center.danger-zone.title") }}</h3>
      <div class="user-info__danger-zone">
        <Button color="danger" @click="showClearSessionsConfirm = true">
          {{ t("web.user-center.sessions.clear.button") }}
        </Button>
        <Button color="danger" @click="showLogoutConfirm = true">
          {{ t("web.auth.logout.button") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-md);

  & > div:not(.mcsl-modal) {
    display: flex;
    flex-direction: column;
    gap: var(--mcsl-spacing-2xs);
  }
}

.user-info__info {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: var(--mcsl-spacing-2xs);
}

.user-info__danger-zone {
  display: flex;
  gap: var(--mcsl-spacing-2xs);

  & > button {
    flex: 1;
  }
}
</style>
