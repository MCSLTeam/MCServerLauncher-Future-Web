import LoadingStatus from '~/utils/loadingStatus';
import LoadingStatusEnum from '~/utils/enums/loadingStatusEnum';

export const mcslLoadingStatus = new LoadingStatus(
	LoadingStatusEnum.LOADING,
	useNuxtApp().$i18n.t('loading.default'),
);
// TODO: 加载
(async () => {
	await sleep(2000);
	mcslLoadingStatus.setMessage(useNuxtApp().$i18n.t('loading.success'));
	mcslLoadingStatus.setLoadingStatus(LoadingStatusEnum.SUCCESS);
})();
