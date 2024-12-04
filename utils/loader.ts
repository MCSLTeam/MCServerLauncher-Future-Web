import LoadingInfo from '~/utils/loadingInfo';

/**
 * MCSLFutureWeb加载进度（首次访问时加载）
 */
export const mcslLoadingInfo = new LoadingInfo('loading', '');
/**
 * 备案号、网站名称等
 */
export const meta: any = reactive({});

export const canHideOverlay = ref(false);

let startLoad;

// TODO: 加载
export async function loadApp() {
	startLoad = Date.now();
	while (useNuxtApp().$i18n == undefined) {
		await sleep(100);
	}
	mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.default'));
	mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.meta'));
	meta.value = (await $fetch('/api/getMeta')).data;
	document.title = document.title.replace(
		'MCSL Future Web',
		meta.value.siteTitle
	);
	useHead({
		titleTemplate: (titleChunk) => {
			return titleChunk
				? `${titleChunk} | ` + meta.value.siteTitle
				: meta.value.siteTitle;
		}
	});
	mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.theme'));
	useDarkMode().loadTheme();
	mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.success'));
	mcslLoadingInfo.setLoadingStatus('success');
	setTimeout(
		() => {
			canHideOverlay.value = true;
		},
		startLoad + 1000 - Date.now()
	);
}
