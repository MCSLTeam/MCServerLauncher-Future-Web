import type {Ref} from 'vue';
import {ref} from 'vue';

/**
 * 加载状态
 *
 * loading - 加载中
 *
 * success - 加载成功
 *
 * fail - 加载失败
 */
export type LoadingStatus = 'loading' | 'success' | 'fail';

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
		this.message = ref(message ?? 'loading.default');
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
