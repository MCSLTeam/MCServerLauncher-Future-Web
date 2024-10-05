<script setup lang="ts">
import type {Ref} from 'vue';
import {$fetch} from 'ofetch';

useHead({
	title: '调试页面',
});

const locale = ref(useLocale().value);
const updateInfo: Ref<any> = ref(null);
const stop = ref(false);
const showUpdateDialog = ref(false);
const locales: Ref<{ label: string; value: string }[]> = ref([]);
(async () => {
	for (const locale in await getI18nMessages()) {
		const langFile = (await import('../assets/i18n/' + locale + '.json'))
			.default;
		locales.value.push({
			label:
				langFile['language.name'] +
				' (' +
				langFile['language.country'] +
				')',
			value: locale,
		});
	}
})();
const i18n = useI18n();

async function checkUpdate() {
	const res = await $fetch('/api/update/check', {
		method: 'POST',
		body: {
			token: getToken(),
		},
	});
	if (res.status == 'ok') {
		if (res.data.update != null) {
			updateInfo.value = res.data.update;
			showUpdateDialog.value = true;
		} else {
			// 已是最新版本
			ElMessage({
				message: i18n.t('request.failed.reason.' + res.message),
				type: 'success',
			});
		}
	} else {
		ElMessage({
			message: i18n.t('update.get.failed', {
				reason:
					typeof res.message === 'object' &&
					res.message.name == 'AxiosError'
						? res.message.message // 服务器无法请求到更新
						: i18n.t('request.failed.reason.' + res.message), // 其他原因
			}),
			type: 'error',
		});
	}
}

async function update() {
	const res = await $fetch('/api/update/update', {
		method: 'POST',
		body: {
			token: getToken(),
			stop: stop.value,
		},
	});
	if (res.status == 'async') {
		i18n.t('update.updating' + res.message);
	} else {
		ElMessage({
			message: i18n.t('update.failed', {
				reason: i18n.t('request.failed.reason.' + res.message),
			}),
			type: 'success',
		});
	}
}

async function uploadFile(e) {
	const file: File = e.file;
	const res = await $fetch('/api/uploadFile', {
		method: 'POST',
		body: {
			token: getToken(),
			name: file.name,
			content: String.fromCharCode(
				...new Uint16Array(await file.arrayBuffer()),
			),
		},
	});
	if (res.status == 'ok') {
		ElMessage('File id: ' + res.data.fileId);
	} else {
		ElMessage({
			message: i18n.t('upload.failed', {
				reason: i18n.t('request.failed.reason.' + res.message),
			}),
			type: 'error',
		});
	}
}

const localResourcepackInput = ref();
const remoteResourcepackInput = ref();

async function addLocalResourcepack() {
	const res = await $fetch('/api/addon/addLocalResourcepack', {
		method: 'POST',
		body: {
			token: getToken(),
			fileId: localResourcepackInput.value,
		},
	});
	if (res.status == 'ok')
		ElMessage({
			message: i18n.t('addon.resourcepack.edit.success'),
			type: 'success',
		});
	else
		ElMessage({
			message: i18n.t('addon.resourcepack.edit.failed', {
				reason: i18n.t('request.failed.reason.' + res.message),
			}),
			type: 'error',
		});
}

async function addRemoteResourcepack() {
	const res = await $fetch('/api/addon/addRemoteResourcepack', {
		method: 'POST',
		body: {
			token: getToken(),
			url: remoteResourcepackInput.value,
		},
	});
	if (res.status == 'ok') {
		ElMessage({
			message: i18n.t('addon.resourcepack.edit.success'),
			type: 'success',
		});
	} else {
		ElMessage({
			message: i18n.t('addon.resourcepack.edit.failed', {
				reason: i18n.t('request.failed.reason.' + res.message),
			}),
			type: 'error',
		});
	}
}
</script>

<template>
	<Page>
		<template #breadcrumb>
			<ElBreadcrumbItem>调试</ElBreadcrumbItem>
		</template>
		<ElDialog
			v-if="updateInfo"
			v-model="showUpdateDialog"
			:title="'MCSL Future Web 更新 - ' + updateInfo.version">
			<sup
				>更新发布时间：{{
					new Date(updateInfo.publish_date).toLocaleString()
				}}</sup
			>
			<p>{{ updateInfo.notes }}</p>
			<ElCheckbox v-model="stop" label="更新完成后关闭MCSL Future Web" />
			<ElFormItem>
				<ElButton @click="showUpdateDialog = false"> 取消</ElButton>
				<ElButton @click="openUrl(updateInfo.version_info)">
					详细信息
				</ElButton>
				<ElButton type="primary" @click="update"> 下载更新</ElButton>
			</ElFormItem>
		</ElDialog>
		<ElForm>
			<ElFormItem label="扩散动画（部分浏览器不支持）">
				<ElButton @click="useDarkMode().changeTheme('light', $event)"
					>浅色模式
				</ElButton>
				<ElButton @click="useDarkMode().changeTheme('dark', $event)"
					>深色模式
				</ElButton>
				<ElButton @click="useDarkMode().changeTheme('auto', $event)"
					>跟随系统
				</ElButton>
			</ElFormItem>
			<ElFormItem label="中心扩散动画（部分浏览器不支持）">
				<ElButton @click="useDarkMode().changeTheme('light')"
					>浅色模式
				</ElButton>
				<ElButton @click="useDarkMode().changeTheme('dark')"
					>深色模式
				</ElButton>
				<ElButton @click="useDarkMode().changeTheme('auto')"
					>跟随系统
				</ElButton>
			</ElFormItem>
			<ElFormItem label="渐变动画">
				<ElButton
					@click="
						useDarkMode().changeTheme('light', undefined, 'fade')
					"
					>浅色模式
				</ElButton>
				<ElButton
					@click="
						useDarkMode().changeTheme('dark', undefined, 'fade')
					"
					>深色模式
				</ElButton>
				<ElButton
					@click="
						useDarkMode().changeTheme('auto', undefined, 'fade')
					"
					>跟随系统
				</ElButton>
			</ElFormItem>
			<ElFormItem label="无动画">
				<ElButton
					@click="
						useDarkMode().changeTheme('light', undefined, 'none')
					"
					>浅色模式
				</ElButton>
				<ElButton
					@click="
						useDarkMode().changeTheme('dark', undefined, 'none')
					"
					>深色模式
				</ElButton>
				<ElButton
					@click="
						useDarkMode().changeTheme('auto', undefined, 'none')
					"
					>跟随系统
				</ElButton>
			</ElFormItem>
			<ElFormItem v-if="locale" label="语言">
				<ElSelect
					v-model="locale"
					label="语言"
					@change="useLocale().setLocale(locale)">
					<ElOption label="系统默认" value="auto" />
					<ElOption
						v-for="(item, index) in locales"
						:key="index"
						:label="item.label"
						:value="item.value" />
				</ElSelect>
			</ElFormItem>
			<ElFormItem label="更新">
				<ElButton @click="checkUpdate">检查更新</ElButton>
			</ElFormItem>
			<ElFormItem label="上传文件">
				<ElUpload
					drag
					accept=".zip"
					:show-file-list="false"
					:http-request="uploadFile">
					<i class="fa fa-upload" />
					<div class="el-upload__text">
						拖拽文件至此处 或 <em>点此上传</em>
					</div>
				</ElUpload>
			</ElFormItem>
			<ElFormItem label="添加本地资源包">
				<ElInput
					v-model="localResourcepackInput"
					label="File id"
					placeholder="File id" />
				<ElButton @click="addLocalResourcepack()">添加</ElButton>
			</ElFormItem>
			<ElFormItem label="添加远程资源包">
				<ElInput
					v-model="remoteResourcepackInput"
					label="URL"
					placeholder="URL" />
				<ElButton @click="addRemoteResourcepack()">添加</ElButton>
			</ElFormItem>
		</ElForm>
	</Page>
</template>

<style scoped></style>
