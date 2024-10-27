<script setup lang="ts">
import {reactive} from 'vue';
import type {FormInstance, FormRules} from 'element-plus';

definePageMeta({
	layout: 'auth',
});

const i18n = useI18n();

useHead({
	title: i18n.t('register.title'),
});

interface RuleForm {
	username: string;
	password: string;
	passwordConfirm: string;
}

const formRef = ref<FormInstance>();
const form = reactive<RuleForm>({
	username: '',
	password: '',
	passwordConfirm: '',
});

const rules = reactive<FormRules<RuleForm>>({
	username: [
		{
			required: true,
			message: i18n.t('form.invalid.require'),
			trigger: 'blur',
		},
		{
			pattern: /[a-zA-Z_]{2,16}/,
			message: i18n.t('form.invalid.format'),
			trigger: 'blur',
		},
	],
	password: [
		{
			required: true,
			message: i18n.t('form.invalid.require'),
			trigger: 'blur',
		},
		{
			pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d$@!%*?&\-_]{8,}$/,
			message: i18n.t('form.invalid.format'),
			trigger: 'blur',
		},
	],
	passwordConfirm: [
		{
			validator: (_rule, value, callback) => {
				if (value == '') {
					callback(new Error(i18n.t('form.invalid.require')));
				} else if (value !== form.password) {
					callback(new Error(i18n.t('register.invalid.confirm')));
				} else {
					callback();
				}
			},
			trigger: 'blur',
		},
	],
});

async function submit() {
	if (!formRef.value) return;
	await formRef.value.validate(async (valid) => {
		if (valid) {
			await registerAdmin(
				form.username,
				form.password,
				() => {
					ElMessage({
						message: i18n.t('register.success'),
						type: 'success',
					});
				},
				(message) => {
					ElMessage({
						message: i18n.t('register.failed', {
							reason: i18n.t('request.failed.reason.' + message),
						}),
						type: 'error',
					});
				},
			);
		}
	});
}
</script>

<template>
	<ElForm ref="formRef" :model="form" :rules="rules">
		<h1>{{ $t('register.title') }}</h1>
		<ElFormItem prop="username">
			<ElInput
				v-model="form.username"
				:placeholder="$t('register.username')" />
		</ElFormItem>
		<ElFormItem prop="password">
			<ElInput
				v-model="form.password"
				type="password"
				:placeholder="$t('register.password')" />
		</ElFormItem>
		<ElFormItem prop="passwordConfirm">
			<ElInput
				v-model="form.passwordConfirm"
				type="password"
				:placeholder="$t('register.password-confirm')" />
		</ElFormItem>
		<ElFormItem>
			<ElButton type="primary" @click="submit"
				>{{ $t('register.submit') }}
			</ElButton>
		</ElFormItem>
	</ElForm>
</template>

<style scoped>
.auth__card h1 {
	width: calc(100% - var(--el-card-padding));
	text-align: center;
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	margin: 0.5rem 0.5rem 2rem 0.5rem;
}

.auth__card .el-form-item * {
	justify-content: flex-end !important;
}

.auth__card .el-button {
  padding: 1.1rem !important;
}
</style>
