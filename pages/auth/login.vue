<script setup lang="ts">
import { reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

definePageMeta({
	layout: 'auth',
});

interface RuleForm {
	username: string;
	password: string;
	rememberMe: boolean;
}

const i18n = useI18n();
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
			pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d$@!%*?&]{8,}$/,
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
				(_) => {
					ElMessage({
						message: i18n.t('login.success'),
						type: 'success',
					});
				},
				(message) => {
					ElMessage({
						message: i18n.t('login.failed', { reason: message }),
						type: 'error',
					});
				},
			);
		}
	});
}
</script>

<template>
	<ElCard class="auth__card">
		<h1>{{ $t('login.title') }}</h1>
		<ElForm ref="formRef" :model="form" :rules="rules">
			<ElFormItem prop="username">
				<ElInput v-model="form.username" :placeholder="$t('login.username')" />
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
	</ElCard>
</template>

<style scoped>
.auth__card {
	margin: 1rem;
	border-radius: 1rem;
	padding: 1rem 1rem 0 1rem;
	width: calc(90% - 2rem);
	max-width: 30rem;
}

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

.auth__copyright {
	color: var(--el-text-color-regular);
}
</style>
