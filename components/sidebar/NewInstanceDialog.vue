<!-- 新建实例 -->
<!-- TODO: 本地化 -->
<script lang="ts" setup>
import {reactive, type Ref, ref} from 'vue';
import type {FormInstance, FormRules} from 'element-plus';
import {pinyin} from 'pinyin-pro';
import {getMcVersions, getTypeVersions, ServerInstallType,} from '~/utils/daemon/serverInstaller';

const visible = defineModel({
	type: Boolean,
	required: true,
});
const i18n = useI18n();
const instancesDirName = ref('服务器目录路径加载中...');
//TODO: 获取服务器目录后 instancesDirName.value = xxx

const mcVersions: Ref<any> = ref(null);
const typeVersions: Ref<string[] | undefined> = ref([]);

(async () => {
	try {
		mcVersions.value = await getMcVersions();
	} catch (e) {
		ElNotification({
			title: useI18n().t('notification.warning.title'),
			message: useI18n().t('dialog.new-instance.failed.load-mc-versions'),
			type: 'warning',
		});
	}
})();

let lastChangedName = '';
const showMCReleases = ref(true);
const showMCSnapshots = ref(false);
const showMCOldVersions = ref(false);

const formRef = ref<FormInstance>();
const form = reactive({
	name: '',
	path: '',
	type: '',
	installType: ServerInstallType.Download,
	mcVer: '',
	typeVer: '',
	core: ref(),
	pack: ref(),
});

const rules = reactive<FormRules<typeof form>>({
	name: [
		{
			required: true,
			message: i18n.t('form.invalid.require'),
			trigger: 'blur',
		},
	],
	path: [{ validator: validatePath, trigger: 'change' }],
	type: [
		{
			required: form.installType === ServerInstallType.Download,
			message: i18n.t('form.invalid.require'),
			trigger: 'change',
		},
	],
	mcVer: [
		{
			required: form.installType === ServerInstallType.Download,
			message: i18n.t('form.invalid.require'),
			trigger: 'change',
		},
	],
	typeVer: [
		{
			required:
				form.installType === ServerInstallType.Download &&
				form.type !== 'vanilla',
			message: i18n.t('form.invalid.require'),
			trigger: 'change',
		},
	],
	core: [
		{
			required: form.installType === ServerInstallType.ImportCore,
			message: i18n.t('form.invalid.require'),
			trigger: 'change',
		},
	],
	pack: [
		{
			required: form.installType === ServerInstallType.ImportPack,
			message: i18n.t('form.invalid.require'),
			trigger: 'change',
		},
	],
});

function validatePath(
	_rule: any,
	value: any,
	callback: (error?: string | Error) => void,
	_source: any,
	_options: any,
) {
	if (value === '') {
		callback(new Error(i18n.t('form.invalid.require')));
	}
	// else if (TODO: 判断路径是否存在 ) {
	//   callback(new Error('实例路径已存在！可能被其他实例占用！'));
	// }
	else {
		callback();
	}
}

function instanceNameInput() {
	if (formatPath(lastChangedName) === form.path) {
		form.path = formatPath(form.name);
	}
	lastChangedName = form.name;
}

function formatPath(path: string) {
	path = path.trim();
	path = pinyin(path, { toneType: 'none', type: 'array' }).join('');
	path = path.replaceAll(/[^a-zA-Z0-9_]+/g, '-');
	return path;
}

function createInstance() {
	if (!formRef.value) return;
	formRef.value.validate(async (valid) => {
		if (valid) {
			// TODO: 创建服务器示例
			ElMessage('正在创建实例... 可在后台任务中查看安装进度');
			addTask(new ProgressTask('创建实例', '正在创建实例...'));
			visible.value = false;
		}
	});
}

function resetForm() {
	if (!formRef.value) return;
	formRef.value.resetFields();
}

async function getTypeVersion() {
	form.typeVer = '';
	const type = form.type;
	const mcVersion = form.mcVer;
	typeVersions.value = [];
	if (form.type === type) {
		typeVersions.value = await getTypeVersions(type, mcVersion);
	}
}
</script>

<template>
	<ElDialog
		v-model="visible"
		title="新建实例"
		width="825px"
		@close="
			visible = false;
			resetForm();
		">
		<ElForm
			ref="formRef"
			v-model="form"
			label-width="100px"
			:model="form"
			:rules="rules">
			<ElFormItem label="实例名称" prop="name" required>
				<ElInput
					v-model="form.name"
					placeholder="请输入实例名称..."
					@input="instanceNameInput" />
			</ElFormItem>
			<ElFormItem label="服务器路径" prop="path" required>
				<ElInput
					v-model="form.path"
					placeholder="请输入服务器文件夹名称..."
					@input="form.path = formatPath(form.path)">
					<template #prepend>{{ instancesDirName }}</template>
				</ElInput>
			</ElFormItem>
			<ElTabs
				@tab-change="
					(name) => (form.installType = name as ServerInstallType)
				">
				<ElTabPane :key="ServerInstallType.Download" label="下载核心">
					<ElFormItem label="服务器类型" prop="type" required>
						<ElSelect
							v-model="form.type"
							placeholder="请选择服务器类型..."
							@change="getTypeVersion">
							<!-- TODO: 调用daemon获取服务器类型列表" -->
							<ElOptionGroup label="原版">
								<ElOption label="Vanilla" value="vanilla" />
							</ElOptionGroup>
							<ElOptionGroup label="模组">
								<ElOption label="Fabric" value="fabric" />
								<ElOption label="Forge" value="forge" />
								<ElOption label="Quilt" value="quilt" />
								<ElOption label="NeoForge" value="neoforge" />
								<ElOption
									label="SpongeVanilla"
									value="spongevanilla" />
								<ElOption
									label="SpongeForge"
									value="spongeforge" />
							</ElOptionGroup>
							<ElOptionGroup label="插件">
								<ElOption
									label="CraftBukkit"
									value="craftbukkit" />
								<ElOption label="Spigot" value="spigot" />
								<ElOption label="Paper" value="paper" />
								<ElOption label="Folia" value="folia" />
								<ElOption label="Leaves" value="leaves" />
								<ElOption
									label="Pufferfish"
									value="pufferfish" />
								<ElOption
									label="Pufferfish+"
									value="pufferfish+" />
								<ElOption
									label="Pufferfish+Purpur"
									value="pufferfish+purpur" />
								<ElOption label="Purpur" value="purpur" />
							</ElOptionGroup>
							<ElOptionGroup label="群组">
								<ElOption
									label="BungeeCord"
									value="bungeecord" />
								<ElOption label="LightFall" value="lightfall" />
								<ElOption
									label="Travertine"
									value="travertine" />
								<ElOption label="Velocity" value="velocity" />
								<ElOption label="Waterfall" value="waterfall" />
							</ElOptionGroup>
							<ElOptionGroup label="混合">
								<ElOption label="ArcLight" value="arclight" />
								<ElOption label="Banner" value="banner" />
								<ElOption label="CatServer" value="catserver" />
								<ElOption label="Mohist" value="mohist" />
								<ElOption label="MohistNeo" value="mohistneo" />
							</ElOptionGroup>
						</ElSelect>
					</ElFormItem>
					<ElFormItem label="服务器版本" prop="mcVer" required>
						<ElSelect
							v-model="form.mcVer"
							placeholder="请选择Minecraft版本..."
							no-data-text="无数据"
							@change="getTypeVersion">
							<template #footer>
								<ElCheckbox
									v-model="showMCReleases"
									label="正式版"
									size="small" />
								<ElCheckbox
									v-model="showMCSnapshots"
									label="快照版"
									size="small" />
								<ElCheckbox
									v-model="showMCOldVersions"
									label="远古版"
									size="small" />
							</template>
							<div v-if="mcVersions">
								<ElOption
									:key="mcVersions.latest.release"
									:label="
										'最新正式版（' +
										mcVersions.latest.release +
										'）'
									"
									:value="mcVersions.latest.release" />
								<ElOption
									:key="mcVersions.latest.snapshot"
									:label="
										'最新快照版（' +
										mcVersions.latest.snapshot +
										'）'
									"
									:value="mcVersions.latest.snapshot" />
								<ElOption
									v-for="version in mcVersions.versions.filter(
										(v: any) =>
											(v.type === 'release' &&
												showMCReleases) ||
											(v.type === 'snapshot' &&
												showMCSnapshots) ||
											(v.type === 'old_beta' &&
												showMCOldVersions) ||
											(v.type === 'old_alpha' &&
												showMCOldVersions),
									)"
									:key="version.id"
									:label="version.id"
									:value="version.id" />
							</div>
						</ElSelect>
					</ElFormItem>
					<ElFormItem
						v-if="form.type !== '' && form.type !== 'vanilla'"
						prop="typeVer"
						required>
						<ElSelect
							v-model="form.typeVer"
							placeholder="请选择第三方服务端版本..."
							no-data-text="无数据">
							<ElOption
								v-for="version in typeVersions"
								:key="version"
								:label="version"
								:value="version" />
						</ElSelect>
					</ElFormItem>
				</ElTabPane>
				<ElTabPane :key="ServerInstallType.ImportCore" label="导入核心">
					<ElFormItem prop="core">
						<ElUpload :ref="form.core" drag style="width: 100%">
							<i class="fa fa-upload" />
							<div class="ElUpload__text">
								拖拽文件至此处或<em>点此上传核心</em>
							</div>
						</ElUpload>
					</ElFormItem>
				</ElTabPane>
				<ElTabPane
					:key="ServerInstallType.ImportPack"
					label="导入服务端整合包">
					<ElFormItem prop="pack">
						<ElUpload :ref="form.pack" drag style="width: 100%">
							<i class="fa fa-upload" />
							<div class="ElUpload__text">
								拖拽文件至此处或<em>点此上传服务端整合包</em>
							</div>
						</ElUpload>
					</ElFormItem>
				</ElTabPane>
			</ElTabs>
			<ElFormItem>
				<ElButton type="primary" @click="createInstance()"
					>新建</ElButton
				>
				<ElButton @click="visible = false">取消</ElButton>
			</ElFormItem>
		</ElForm>
	</ElDialog>
</template>

<style scoped></style>
