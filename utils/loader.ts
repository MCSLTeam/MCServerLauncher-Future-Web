import LoadingStatus from '~/utils/loadingStatus';
import LoadingStatusEnum from '~/utils/enums/loadingStatusEnum';

export const mcslLoadingStatus = new LoadingStatus(
	LoadingStatusEnum.LOADING,
	'',
);
export const beian = ref('');

// TODO: 加载
(async () => {
	while (useNuxtApp().$i18n == undefined) {
		await sleep(100);
	}
	mcslLoadingStatus.setMessage(useNuxtApp().$i18n.t('loading.default'));
	await sleep(2000);
	beian.value = (await $fetch('/api/getBeian')).data.beian;
	mcslLoadingStatus.setMessage(useNuxtApp().$i18n.t('loading.success'));
	mcslLoadingStatus.setLoadingStatus(LoadingStatusEnum.SUCCESS);
})();
