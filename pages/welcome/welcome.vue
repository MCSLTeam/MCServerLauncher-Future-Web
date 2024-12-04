<script setup lang="ts">
import type { Ref } from 'vue';

definePageMeta({
	layout: 'empty'
});

const i18n = useI18n();
const messages = await getI18nMessages();

useHead({
	title: i18n.t('welcome.welcome')
});

const theme = ref(useDarkMode().value);
const themes: Ref<{ label: string; value: string }[]> = ref([
	{ label: i18n.t('settings.general.theme.auto'), value: 'auto' },
	{ label: i18n.t('settings.general.theme.light'), value: 'light' },
	{ label: i18n.t('settings.general.theme.dark'), value: 'dark' }
]);

const locale = ref(useLocale().value);
const locales: Ref<{ label: string; value: string }[]> = ref([
	{ label: i18n.t('settings.general.locale.auto'), value: 'auto' }
]);
(async () => {
	for (const locale in messages) {
		locales.value.push({
			label:
				messages[locale]['language.name'] +
				' (' +
				messages[locale]['language.country'] +
				')',
			value: locale
		});
	}
})();

const welcomeText = ref('');
const showWelcomeTextCursor = ref(true);
const interval: any[] = [];
let currText = messages[useLocale().getLocale(locale.value)]['welcome.welcome'];
let index = 0;
let mode: 'append' | 'delete' | 'wait' = 'append';

function changeLocale() {
	useLocale().setLocale(locale.value);
	currText = messages[useLocale().getLocale(locale.value)]['welcome.welcome'];
	index = 0;
	if (mode != 'wait') mode = 'append';
	else welcomeText.value = currText;
}

onMounted(async () => {
	interval.push(setInterval(() => {
		showWelcomeTextCursor.value = !showWelcomeTextCursor.value;
	}, 500));
	interval.push(setInterval(async () => {
		if (mode === 'delete') {
			index--;
			welcomeText.value = currText.slice(0, index);
			if (index == 0) {
				mode = 'append';
				let temp;
				do {
					temp = messages[Object.keys(messages)[randNum(Object.keys(messages).length)]]['welcome.welcome'];
				} while (temp !== currText);
				currText = temp;
			}
		} else if (mode === 'append') {
			index++;
			welcomeText.value = currText.slice(0, index + 1);
			if (index >= currText.length - 1) {
				mode = 'wait';
				await sleep(2000);
				mode = 'delete';
			}
		}
	}, 250));
});

onUnmounted(() => {
	for (const i of interval) {
		clearInterval(i);
	}
});
</script>

<template>
	<div v-show="canHideOverlay" class="welcome__container">
		<FancyBackground light="7" />
		<div class="welcome__container-inner">
			<div class="welcome__section welcome__section-1">
				<div class="welcome__text">
					<h2>{{ welcomeText }}<span v-show="showWelcomeTextCursor">_</span>&nbsp;</h2>
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
									@change="changeLocale" />
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

.welcome__text {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: start;
	opacity: 0;
	animation: 0.5s ease-in-out fadeIn 0.5s both;
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
	height: calc(100% - 1rem);
	opacity: 0;
	animation: 0.5s ease-in-out fadeInUp 0.5s both;
	@media (max-width: 768px) {
		width: calc(100% - 4rem);
		height: fit-content;
	}
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
