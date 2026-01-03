<script setup lang="ts">
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { createForm } from "@repo/ui/src/utils/form.ts";
import * as yup from "yup";
import Form from "@repo/ui/src/components/form/Form.vue";
import FormEntry from "@repo/ui/src/components/form/FormEntry.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import SetupLayout from "packages/shared/src/layouts/SetupLayout.vue";

const form = createForm(
  {
    name: "",
    password: "",
    passwordConfirm: "",
    remember: true,
  },
  yup.object({
    name: yup.string().label("用户名").required(),
    password: yup.string().label("密码").required(),
    passwordConfirm: yup
      .string()
      .label("确认密码")
      .oneOf([yup.ref("password")], "两次输入的密码不一致")
      .required(),
    remember: yup.boolean().label("记住我").oneOf([false]).required(),
  }),
  "input",
);
</script>

<template>
  <SetupLayout>
    <h2>注册管理员账户</h2>
    <Form :form="form" @submit="console.log('submit', form.data.value)">
      <FormEntry name="name">
        <InputText placeholder="请设置用户名..." />
      </FormEntry>
      <FormEntry name="password">
        <InputText placeholder="请设置密码..." password />
      </FormEntry>
      <FormEntry name="passwordConfirm">
        <InputText placeholder="请再次输入密码..." password />
      </FormEntry>
      <Button block type="primary" color="primary" btn-type="submit"
        >注册</Button
      >
    </Form>
  </SetupLayout>
</template>

<style scoped lang="scss"></style>
