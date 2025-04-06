import {computed, type Ref, ref} from "vue";
import {useDarkMode, useLocale} from "./uses";
import {sleep} from "./common";
import {useLocalStorage} from "@vueuse/core";
import {refreshDaemon} from "./daemon/daemons.ts";

/**
 * 加载状态
 *
 * loading - 加载中
 *
 * success - 加载成功
 *
 * fail - 加载失败
 */
export type LoadingStatus = "loading" | "success" | "fail";

/**
 * 加载状态类
 */
export default class LoadingInfo {
    private readonly loadingStatus: Ref<LoadingStatus>;
    private readonly message: Ref<string>;

    /**
     * 创建加载状态
     * @param loadingStatus - 加载状态
     * @param message - 消息本地化键名（默认为loading.default）
     */
    constructor(loadingStatus: LoadingStatus, message?: string) {
        this.loadingStatus = ref(loadingStatus);
        this.message = ref(message ?? "loading.default");
    }

    /**
     * 获取加载状态
     */
    getLoadingStatus() {
        return this.loadingStatus;
    }

    /**
     * 获取消息本地化键名
     */
    getMessage() {
        return this.message;
    }

    /**
     * 设置消息本地化键名
     * @param message - 消息本地化键名
     */
    setMessage(message: string) {
        this.message.value = message;
    }

    /**
     * 设置加载状态
     * @param loadingStatus - 加载状态
     */
    setLoadingStatus(loadingStatus: LoadingStatus) {
        this.loadingStatus.value = loadingStatus;
    }
}

/**
 * MCSLFutureWeb加载进度（首次访问/刷新时加载）
 */
export const mcslLoadingInfo = new LoadingInfo("loading", "");

export const canHideOverlay = ref(false);

const agreedEulaStorage = useLocalStorage("agreedEula", "false");

export const agreedEula = computed({
    get: () => agreedEulaStorage.value === "true",
    set: (value: boolean) => (agreedEulaStorage.value = value.toString()),
});

let startLoad;

// TODO: 加载
export async function loadApp(
    customTask: (loadingInfo: LoadingInfo) => Promise<void> = async () => {
    },
) {
    startLoad = Date.now();
    while (useLocale().getI18n() == undefined) {
        await sleep(100);
    }
    mcslLoadingInfo.setMessage(useLocale().getI18n().t("loading.theme"));
    useDarkMode().loadTheme();

    await customTask(mcslLoadingInfo);

    mcslLoadingInfo.setMessage(useLocale().getI18n().t("loading.daemon"));
    await refreshDaemon()

    mcslLoadingInfo.setMessage(useLocale().getI18n().t("loading.success"));
    mcslLoadingInfo.setLoadingStatus("success");
    setTimeout(
        () => {
            canHideOverlay.value = true;
        },
        startLoad + 1000 - Date.now(),
    );
}
