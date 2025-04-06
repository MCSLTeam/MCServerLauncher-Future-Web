<script setup lang="ts">
import {reactive} from "vue";
import type {FormInstance, FormRules} from "element-plus";
import {formatError} from "@repo/commons/src/utils/common.ts";

definePageMeta({
  layout: "auth",
});

const i18n = useI18n();

useHead({
  title: i18n.t("auth.login.title"),
});

interface RuleForm {
  username: string;
  password: string;
  remember: boolean;
}

const formRef = ref<FormInstance>();
const form = reactive<RuleForm>({
  username: "",
  password: "",
  remember: false,
});

const rules = reactive<FormRules<RuleForm>>({
  username: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
    {
      pattern: /[a-zA-Z_]{2,16}/,
      message: i18n.t("form.invalid.format"),
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: i18n.t("form.invalid.require"),
      trigger: "blur",
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d$@!%*?&\-_]{8,}$/,
      message: i18n.t("form.invalid.format"),
      trigger: "blur",
    },
  ],
});

async function submit() {
  await formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await useAccount().login(form.username, form.password, form.remember);
        ElMessage.success(i18n.t("auth.login.success"));
        await useRouter().push("/");
      } catch (e: any) {
        ElMessage.error(formatError("auth.login.failed", e));
        console.error(formatError("auth.login.failed", e), e)
      }
    }
  });
}
</script>

<template>
  <ElForm ref="formRef" class="auth__content-card" :model="form" :rules="rules">
    <h1>{{ $t("auth.login.title") }}</h1>
    <h2>{{ $t("auth.login.subtitle") }}</h2>
    <ElFormItem prop="username">
      <ElInput
          v-model="form.username"
          :placeholder="$t('auth.login.username')"
      />
    </ElFormItem>
    <ElFormItem prop="password">
      <ElInput
          v-model="form.password"
          type="password"
          :placeholder="$t('auth.login.password')"
      />
    </ElFormItem>
    <ElFormItem prop="remember">
      <ElCheckbox
          v-model="form.remember"
          :label="$t('auth.login.remember-me')"
      />
      <ElButton type="primary" @click="submit"
      >{{ $t("auth.login.submit") }}
      </ElButton>
    </ElFormItem>
  </ElForm>
</template>

<style scoped>
@media (min-width: 768px) {
  .auth__content-card {
    width: 75%;
  }
}

.auth__right h1 {
  width: calc(100% - var(--el-card-padding));
  text-align: center;
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
  margin: 0.5rem;
}

.auth__right h2 {
  width: calc(100% - var(--el-card-padding));
  text-align: center;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0.5rem 0.5rem 2rem 0.5rem;
}

.auth__right .el-button {
  margin-top: 15px;
  padding: 1.1rem !important;
  width: 100%;
  font-size: var(--el-font-size-medium);
}
</style>
