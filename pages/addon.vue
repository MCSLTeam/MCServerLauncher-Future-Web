<script lang="ts" setup>
import {ref} from 'vue';
import {$fetch} from 'ofetch';
import axios from 'axios';

const i18n = useI18n();

// 资源包
const resourcepackInfos = ref<any | undefined>();
const resourcepacks = ref<any[] | undefined>();
const enabledResourcepacks = ref<string[] | undefined>();
(async () => {
	const data = await $fetch('/api/addon/getResourcepack', {
		method: 'POST',
		body: {
			token: getToken(),
		},
	});
	if (data.status != 'ok') {
		ElMessage({
			message: i18n.t('addon.resourcepack.fetch-failed', {
				reason: i18n.t('request.failed.reason.' + data.message),
			}),
			type: 'error',
		});
		return;
	}
	const result: any[] = data.data.resourcepacks;
	enabledResourcepacks.value = result
		.filter((item) => item.enabled || item.type == 'system')
		.map((item) => item.url);
	const temp = [];
	for (const item of result) {
		let info;
		switch (item.type) {
			case 'system':
				if (item.url == 'plugin-resource')
					info = {
						platform: 'web',
						type: 'resourcepack',
						format: 0,
						id: 'plugin-resources',
						version: i18n.t(
							'addon.resourcepack.default.plugin-resources.version',
						),
						name: i18n.t(
							'addon.resourcepack.default.plugin-resources.name',
						),
						description: i18n.t(
							'addon.resourcepack.default.plugin-resources.desc',
						),
					};
				break;
			case 'local':
				info = await $fetch('/api/addon/resourcepack' + item.url);
				break;
			case 'remote':
				info = (await axios(item.url)).data;
				break;
		}
		if (!info || typeof info != 'object') continue;
		if (!resourcepackInfos.value) resourcepackInfos.value = {};
		resourcepackInfos.value[item.url] = info;
		temp.push({
			url: item.url,
			name: info.name,
			info: info,
		});
	}
	resourcepacks.value = temp;
})();

useHead({
	title: i18n.t('sidebar.addon'),
});

const activeTab = ref(
	useRoute().hash != '' ? useRoute().hash.slice(1) : 'addon-center',
);
</script>

<template>
	<Page>
		<template #breadcrumb>
			<ElBreadcrumbItem>{{ $t('sidebar.addon') }}</ElBreadcrumbItem>
		</template>
		<ElCard class="addon__container">
			<ElTabs v-model="activeTab" @tab-change="newsPage = 1">
				<!-- 扩展广场 -->
				<ElTabPane :label="$t('addon.center')" name="addon-center">
					<div v-if="false" class="addon__tab">
						<div
							v-loading="true"
							class="addon__loading-icon"
							element-loading-background="rgba(255, 255, 255, 0.5)" />
						<ElSkeleton animated>
							<template #template/>
						</ElSkeleton>
					</div>
					<div v-else class="addon__tab">
						<ElEmpty description="施工中..." />
					</div>
				</ElTabPane>

				<!-- 资源包 -->
				<ElTabPane
					:label="$t('addon.resourcepack')"
					name="resourcepack">
					<div
						v-if="!resourcepacks || !enabledResourcepacks"
						class="addon__tab">
						<div
							v-loading="true"
							class="addon__loading-icon"
							element-loading-background="rgba(255, 255, 255, 0.5)" />
						<ElTransfer
							v-model="enabledResourcepacks"
							:data="resourcepacks"
							:titles="[
								$t('addon.resourcepack.select.disabled'),
								$t('addon.resourcepack.select.enabled'),
							]"
							:button-texts="[
								$t('addon.resourcepack.select.disable'),
								$t('addon.resourcepack.select.enable'),
							]"
							:filterable="true"
							:filter-placeholder="
								$t('addon.resourcepack.select.search')
							" />
					</div>
					<div v-else class="addon__tab"/>
				</ElTabPane>

				<!-- 插件 -->
				<ElTabPane :label="$t('addon.plugin')" name="plugin">
					<ElEmpty description="施工中..." />
				</ElTabPane>
			</ElTabs>
		</ElCard>
	</Page>
</template>

<style scoped>
.addon__container {
	width: calc(100% - 22px);
	border-radius: 15px;
	margin: 10px;
}

.addon__loading-icon {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
}

.addon__tab {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	padding: 5px;
}
</style>

<style>
.addon__container > div {
	height: calc(100% - 40px);
}
</style>
