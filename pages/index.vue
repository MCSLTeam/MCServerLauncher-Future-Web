<script lang="ts" setup>
import type {Ref} from 'vue';
import MD5 from 'crypto-js/md5';

const i18n = useI18n();

useHead({
	title: i18n.t('sidebar.home'),
});

const announcement: Ref<any> = ref(null);
const announcementClosed = ref(localStorage.getItem('announcementClosed'));

(async () => {
	// TODO: 获取公告
	announcement.value = {
		text: 'MCServerLauncher Future 是 MCSL开发组 全新的项目！<br>本 Web 程序仅仅是其中的一部分，需要 Daemon 配合使用！<br>同时我们也在制作 WPF 版，可作为本 Web 版的替代！',
		type: 'primary',
		closable: true,
	};
})();

function closeAnnouncement() {
	if (announcement.value) {
		const encoded = MD5(announcement.value.text).toString();
		announcementClosed.value = encoded;
		localStorage.setItem('announcementClosed', encoded);
	}
}
</script>

<template>
	<ElContainer direction="vertical">
		<Header>
			<template #breadcrumb>
				<ElBreadcrumb-item>{{ $t('sidebar.home') }}</ElBreadcrumb-item>
			</template>
		</Header>
		<ElMain class="index__main">
			<ElScrollbar>
				<!-- 公告 -->
				<ElAlert
					v-if="
						!announcement.closable ||
						!announcementClosed ||
						announcementClosed != MD5(announcement.text).toString()
					"
					class="index__announcement"
					:title="$t('announcement.title')"
					:type="announcement.type"
					:closable="announcement.closable"
					:close-text="$t('announcement.close')"
					@close="closeAnnouncement">
					<p
						class="index__announcement-desc"
						v-html="announcement.text" />
				</ElAlert>
				<ElCard class="index__card">
					<h1>{{ $t('index.overview') }}</h1>
					<ElRow>
						<ElCol :span="6">
							<ElProgress type="dashboard" :percentage="50">
								<template #default>
									<h3>114 / 514</h3>
									<p>{{ $t('index.overview.instances') }}</p>
								</template>
							</ElProgress>
						</ElCol>
						<ElCol :span="6">
							<ElProgress type="dashboard" :percentage="50">
								<template #default>
									<h3>114 / 514</h3>
									<p>
										{{ $t('index.overview.online-users') }}
									</p>
								</template>
							</ElProgress>
						</ElCol>
						<ElCol :span="6">
							<ElProgress type="dashboard" :percentage="50">
								<template #default>
									<h3>114G / 514G</h3>
									<p>{{ $t('index.overview.disk-usage') }}</p>
								</template>
							</ElProgress>
						</ElCol>
						<ElCol :span="6">
							<ElProgress type="dashboard" :percentage="50">
								<template #default>
									<h3>114G / 514G</h3>
									<p>{{ $t('index.overview') }}</p>
								</template>
							</ElProgress>
						</ElCol>
					</ElRow>
				</ElCard>
				<Footer />
			</ElScrollbar>
		</ElMain>
	</ElContainer>
</template>

<style scoped>
.index__main {
	padding: 0;
}

.index__announcement {
	width: calc(100% - 20px);
}

.index__announcement,
.index__card {
	margin: 10px;
	box-shadow: var(--el-box-shadow-light);
	width: calc(100% - 20px);
	border-radius: 10px;
}

.index__announcement.el-alert--info {
	border: 1px solid var(--el-border-color);
	background: var(--el-bg-color);
}

.index__announcement.el-alert--success {
	border: 1px solid var(--el-color-success-light-5);
}

.index__announcement.el-alert--primary {
	--el-alert-bg-color: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	background-color: var(--el-alert-bg-color);
	border: 1px solid var(--el-color-primary-light-5);
}

.index__announcement.el-alert--warning {
	border: 1px solid var(--el-color-warning-light-5);
}

.index__announcement.el-alert--error {
	border: 1px solid var(--el-color-danger-light-5);
}

.index__announcement-desc {
	margin: 0;
}
</style>

<style>
.index__announcement.el-alert--info .el-alert__title {
	color: var(--el-text-color-regular);
}
</style>
