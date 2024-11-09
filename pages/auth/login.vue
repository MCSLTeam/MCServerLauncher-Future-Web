<script setup lang="ts">
import { reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

definePageMeta({
	layout: 'auth',
});

const i18n = useI18n();

useHead({
	title: i18n.t('login.title'),
});

interface RuleForm {
	username: string;
	password: string;
	rememberMe: boolean;
}

const formRef = ref<FormInstance>();
const form = reactive<RuleForm>({
	username: '',
	password: '',
	rememberMe: false,
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
});

async function submit() {
	if (!formRef.value) return;
	await formRef.value.validate(async (valid) => {
		if (valid) {
			await login(
				form.username,
				form.password,
				form.rememberMe,
				() => {
					ElMessage({
						message: i18n.t('login.success'),
						type: 'success',
					});
				},
				(message) => {
					ElMessage({
						message: i18n.t('login.failed', {
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
		<h1>{{ $t('login.title') }}</h1>
		<ElFormItem prop="username">
			<ElInput
				v-model="form.username"
				:placeholder="$t('login.username')" />
		</ElFormItem>
		<ElFormItem prop="password">
			<ElInput
				v-model="form.password"
				type="password"
				:placeholder="$t('login.password')" />
		</ElFormItem>
		<ElFormItem>
			<ElCheckbox
				v-model="form.rememberMe"
				:label="$t('login.remember-me')" />
			<ElButton type="primary" @click="submit"
				>{{ $t('login.submit') }}
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
	justify-content: space-between !important;
}

.auth__card .el-button {
	padding: 1.1rem !important;
}
</style>
