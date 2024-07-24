<script lang="ts" setup>
import axios from 'axios';
import {ElNotification} from 'element-plus';
import {type Ref, ref} from 'vue';

const activeTab = ref(
	location.href.split('#').length === 2
		? location.href.split('#')[1]
		: 'mc-update',
);
const page = ref(1);

const minecraftUpdates: Ref<any> = ref(null);
const minecraftNews: Ref<any> = ref(null);

axios
	.get('https://launchercontent.mojang.com/javaPatchNotes.json')
	.then((res) => {
		minecraftUpdates.value = res.data;
	})
	.catch(() => {
		ElNotification({
			title: useI18n().t('notification.warning.title'),
			message: useI18n().t('news.mc-update.load-failed'),
			type: 'warning',
		});
	});

axios
	.get('https://launchercontent.mojang.com/news.json')
	.then((res) => {
		minecraftNews.value = res.data;
	})
	.catch(() => {
		ElNotification({
			title: useI18n().t('notification.warning.title'),
			message: useI18n().t('news.mc-news.load-failed'),
			type: 'warning',
		});
	});
</script>

<template>
	<ElContainer direction="vertical">
		<Header>
			<template #breadcrumb>
				<ElBreadcrumbItem>{{ $t('sidebar.news') }}</ElBreadcrumbItem>
			</template>
		</Header>
		<ElMain class="news__main">
			<ElScrollbar>
				<ElCard class="news__container">
					<ElTabs v-model="activeTab" @tab-change="page = 1">
						<ElTabPane
							:label="$t('news.tabs.mc-update')"
							name="mc-update">
							<div v-if="!minecraftUpdates" class="news__loading">
								<div
									v-loading="true"
									class="news__loading-icon"
									element-loading-background="rgba(255, 255, 255, 0.5)" />
								<ElSkeleton animated>
									<template #template>
										<div class="news__cards">
											<ElCard
												v-for="index in 25"
												:key="index"
												class="news__card">
												<ElSkeletonItem
													variant="image"
													class="news__img"
													style="
														height: calc(
															100% - 80px
														);
													" />
												<br >
												<ElSkeletonItem
													variant="h3"
													class="news__title"
													style="width: 90%" />
												<br >
												<ElSkeletonItem
													variant="p"
													class="news__desc"
													style="width: 75%" />
											</ElCard>
										</div>
									</template>
								</ElSkeleton>
							</div>

							<div v-else class="news__tab">
								<ElDialog
									v-for="item in minecraftUpdates.entries.slice(
										(page - 1) * 20,
										page * 20,
									)"
									:key="item.version"
									v-model="item.openDialog"
									width="777px"
									:title="item.title"
									@close="item.openDialog = false">
									<ElScrollbar height="500px">
										<ElText>
											<span
												class="news__dialog"
												v-html="item.body" />
										</ElText>
									</ElScrollbar>
								</ElDialog>

								<ElPagination
									v-model:current-page="page"
									layout="prev, pager, next, ->"
									:page-size="20"
									:total="minecraftUpdates.entries.length" />
								<div class="news__cards">
									<ElCard
										v-for="item in minecraftUpdates.entries.slice(
											(page - 1) * 20,
											page * 20,
										)"
										:key="item.version"
										class="news__card"
										@click="item.openDialog = true">
										<img
											class="news__img"
											:src="
												'https://launchercontent.mojang.com/' +
												item.image.url
											"
											:alt="item.image.title" >
										<h3 class="news__title">
											{{ item.title }}
										</h3>
										<p class="news__desc">
											{{
												item.type
													.slice(0, 1)
													.toUpperCase() +
												item.type.slice(1) +
												' ' +
												item.version
											}}
										</p>
									</ElCard>
								</div>
								<ElPagination
									v-model:current-page="page"
									layout="prev, pager, next, ->"
									:page-size="20"
									:total="minecraftUpdates.entries.length" />
							</div>
						</ElTabPane>

						<ElTabPane
							:label="$t('news.tabs.mc-news')"
							name="mc-news">
							<div v-if="!minecraftNews" class="news__loading">
								<div
									v-loading="true"
									class="news__loading-icon"
									element-loading-background="rgba(255, 255, 255, 0.5)" />
								<ElSkeleton animated>
									<template #template>
										<div class="news__cards">
											<ElCard
												v-for="index in 25"
												:key="index"
												class="news__card">
												<ElSkeletonItem
													variant="image"
													class="news__img"
													style="
														height: calc(
															100% - 100px
														);
													" />
												<br >
												<ElSkeletonItem
													variant="h3"
													class="news__title"
													style="width: 100%" />
												<br >
												<ElSkeletonItem
													class="news__desc"
													variant="p"
													style="width: 75%" />
												<br >
												<ElSkeletonItem
													class="news__date"
													variant="p"
													style="width: 50%" />
											</ElCard>
										</div>
									</template>
								</ElSkeleton>
							</div>

							<div v-else class="news__tab">
								<ElPagination
									v-model:current-page="page"
									layout="prev, pager, next, ->"
									:page-size="20"
									:total="minecraftNews.entries.length" />
								<div class="news__cards news__cards-masonry">
									<ElCard
										v-for="item in minecraftNews.entries.slice(
											(page - 1) * 20,
											page * 20,
										)"
										:key="item.id"
										class="news__card"
										@click="openUrl(item.readMoreLink)">
										<img
											class="news__img"
											:src="
												'https://launchercontent.mojang.com/' +
												item.playPageImage.url
											"
											:alt="item.playPageImage.title" >
										<h3 class="news__title">
											{{ item.title }}
										</h3>
										<p class="news__desc">
											{{ item.text }}
										</p>
										<p class="news__date">
											{{ item.date }}
										</p>
									</ElCard>
								</div>
								<ElPagination
									v-model:current-page="page"
									layout="prev, pager, next, ->"
									:page-size="20"
									:total="minecraftNews.entries.length" />
							</div>
						</ElTabPane>
					</ElTabs>
				</ElCard>
			</ElScrollbar>
		</ElMain>
	</ElContainer>
</template>

<style scoped>
.news__main {
	padding: 0;
}

.news__container {
	width: calc(100% - 22px);
	border-radius: 15px;
	opacity: 0;
	margin: 10px;
	animation: 0.5s ease-in-out both fadeIn;
}

.news__loading {
	width: 100%;
	height: calc(100vh - 200px);
	overflow: hidden;
}

.news__loading-icon {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
}

.news__tab {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	padding: 5px;
}

.news__cards {
	display: block;
	padding: 10px;
	column-count: 5;
	column-width: 200px;
	column-gap: 10px;
}

.news__card {
	width: 200px;
	height: 285px;
	border-radius: 10px;
	margin: 0 0 10px 0;
	flex-shrink: 0;
	cursor: pointer;
	opacity: 0;
	animation: 0.5s ease-in-out both 0.2s fadeIn;
}

.news__card:hover {
	scale: 1.025;
}

.news__card .news__img {
	position: relative;
	left: -20px;
	margin-bottom: 10px;
	width: calc(100% + 40px);
}

.news__card .news__title {
	font-size: var(--el-font-size-base);
	color: var(--el-text-color-primary);
	margin: 0;
}

.news__card .news__desc {
	font-size: var(--el-font-size-extra-small);
	margin: 3px 0;
	color: var(--el-text-color-regular);
}

.news__card .news__date {
	margin: 0;
	color: var(--el-text-color-secondary);
	font-size: 10px;
}

.news__cards.news__cards-masonry .news__card {
	margin: 0 0 10px 0;
	height: fit-content;
}
</style>

<style>
.news__container > div {
	height: calc(100% - 40px);
}

.news__card > div {
	height: calc(100% - 20px);
	padding: 0 20px 20px 20px;
}

.news__dialog a {
	color: var(--el-text-color-regular);
	transition: 0.3s ease-in-out;
}

.news__dialog a:hover {
	color: var(--el-color-primary);
}
</style>
