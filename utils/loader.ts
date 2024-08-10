import LoadingInfo from '~/utils/loadingInfo';

/**
 * MCSLFutureWeb加载进度（首次访问时加载）
 */
export const mcslLoadingInfo = new LoadingInfo('loading', '');
/**
 * 备案号
 */
export const beian = ref('');

// TODO: 加载
(async () => {
    while (useNuxtApp().$i18n == undefined) {
        await sleep(100);
    }
    mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.default'));
    beian.value = (await $fetch('/api/getBeian')).data.beian;
    mcslLoadingInfo.setMessage(useNuxtApp().$i18n.t('loading.success'));
    mcslLoadingInfo.setLoadingStatus('success');
})();
