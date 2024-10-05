<script setup lang="ts">
import type {Ref} from 'vue';

definePageMeta({
	layout: 'empty',
});

const i18n = useI18n();

const theme = ref(useDarkMode().value);
const themes: Ref<{ label: string; value: string }[]> = ref([
	{ label: i18n.t('settings.general.theme.auto'), value: 'auto' },
	{ label: i18n.t('settings.general.theme.light'), value: 'light' },
	{ label: i18n.t('settings.general.theme.dark'), value: 'dark' },
]);

const locale = ref(useLocale().value);
const locales: Ref<{ label: string; value: string }[]> = ref([
	{ label: i18n.t('settings.general.locale.auto'), value: 'auto' },
]);
(async () => {
	const messages = await getI18nMessages();
	for (const locale in messages) {
		locales.value.push({
			label:
				messages[locale]['language.name'] +
				' (' +
				messages[locale]['language.country'] +
				')',
			value: locale,
		});
	}
})();
</script>

<template>
	<div class="welcome__container">
		<FancyBackground light="7" />
		<div class="welcome__container-inner">
			<div class="welcome__section welcome__section-1">
				<div class="welcome__text">
					<h2>{{ $t('welcome.title') }}</h2>
					<h1>
						{{ $t('app.name.abbr') }}
						<span>{{ $t('app.name.future') }}</span>
						{{ $t('app.name.web') }}
					</h1>
					<h3>{{ $t('welcome.subtitle') }}</h3>
				</div>
			</div>
			<div class="welcome__section welcome__section-2">
				<ElCard class="welcome__card">
					<h1>{{ $t('welcome.settings') }}</h1>
					<ElScrollbar>
						<ElForm>
							<ElFormItem :label="$t('settings.general.theme')">
								<ElSelectV2
									v-model="theme"
									:options="themes"
									@change="
										useDarkMode().changeTheme(theme)
									" />
							</ElFormItem>
							<ElFormItem
								v-if="locales"
								:label="$t('settings.general.locale')">
								<ElSelectV2
									v-model="locale"
									:options="locales"
									@change="useLocale().setLocale(locale)" />
							</ElFormItem>
						</ElForm>
					</ElScrollbar>
					<ElButton
						type="primary"
						@click="$router.push('/welcome/eula')"
						>{{ $t('welcome.next') }}
					</ElButton>
				</ElCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
.welcome__container,
.welcome__container-inner {
	width: 100%;
	height: 100%;
	margin: 0;
}

.welcome__container-inner {
	display: flex;
	justify-content: center;
	align-items: center;
	@media (max-width: 768px) {
		flex-direction: column;
	}
}

.welcome__container-inner * {
	z-index: 1;
}

.welcome__section {
	width: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 24px;
	@media (max-width: 768px) {
		width: calc(100% - 48px);
	}
}

@media (max-width: 768px) {
	.welcome__section-1 {
		margin-top: 3rem;
	}

	.welcome__section-2 {
		height: 100%;
	}
}

.welcome__text {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: start;
	@media (max-width: 768px) {
		align-items: center;
		text-align: center;
		width: calc(100% - 48px);
	}
}

.welcome__text h2 {
	margin: 0;
	font-size: 2rem;
	color: var(--el-text-color-regular);
	font-weight: normal;
	@media (max-width: 768px) {
		font-size: 1.75rem;
	}
}

.welcome__text h1 {
	font-size: 2.75rem;
	width: fit-content;
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	margin: 5px 0;
	@media (max-width: 768px) {
		font-size: 2rem;
	}
}

.welcome__text h3 {
	margin: 0;
	font-size: 1.5rem;
	color: var(--el-text-color-secondary);
	font-weight: normal;
	@media (max-width: 768px) {
		font-size: 1.25rem;
	}
}

.welcome__text h1 span {
	font-weight: bold;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-primary-dark-2)
	);
	background-clip: text;
}

.welcome__card {
	border-radius: 1rem;
	width: 100%;
	max-width: 30rem;
	padding: 1rem;
	height: 100%;
}

.welcome__card h1 {
	margin: 0 0 1rem 0;
	font-size: 2rem;
	color: var(--el-text-color-regular);
	font-weight: var(--el-font-weight-primary);
	@media (max-width: 768px) {
		font-size: 1.5rem;
		text-align: center;
	}
}
</style>
