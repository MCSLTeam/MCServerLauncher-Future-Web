import {ref} from 'vue';
import type LoadingStatusEnum from './enums/loadingStatusEnum.ts';
import type {Ref} from 'vue';

export default class LoadingStatus {
    private readonly loadingStatus: Ref<LoadingStatusEnum>;
    private readonly message: Ref<string>;

    constructor(loadingStatus: LoadingStatusEnum, message?: string) {
        this.loadingStatus = ref(loadingStatus);
        this.message = ref(message ?? 'loading.default');
    }

    getLoadingStatus() {
        return this.loadingStatus;
    }

    getMessage() {
        return this.message;
    }

    setMessage(message: string) {
        this.message.value = message;
    }

    setLoadingStatus(loadingStatus: LoadingStatusEnum) {
        this.loadingStatus.value = loadingStatus;
    }
}
