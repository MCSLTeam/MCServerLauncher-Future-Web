<script lang="ts" setup>
import axios from 'axios';
import {ElNotification} from 'element-plus';
import {type Ref, ref} from 'vue';

const activeTab = ref(
	useRoute().hash != '' ? useRoute().hash.slice(1) : 'je-update',
);
const newsPage = ref(1);

const dialog = ref({
	open: false,
	title: null,
	body: null,
});

const i18n = useI18n();
const jeUpdates: Ref<any> = ref(null);
const beUpdates: Ref<any> = ref(null);
const minecraftNews: Ref<any> = ref(null);

function sortByDate(a: any, b: any) {
	return new Date(b.date).getTime() - new Date(a.date).getTime();
}

axios
	.get('https://launchercontent.mojang.com/v2/javaPatchNotes.json', {
		headers: {
			'Cache-Control': 'no-cache',
		},
	})
	.then((res) => {
		jeUpdates.value = res.data.entries.sort(sortByDate);
	})
	.catch((e) => {
		ElNotification({
			title: i18n.t('notification.warning.title'),
			message: i18n.t('news.je-update.load-failed'),
			type: 'warning',
		});
		console.log(i18n.t('news.je-update.load-failed'), e);
	});
axios
	.get('https://launchercontent.mojang.com/v2/bedrockPatchNotes.json', {
		headers: {
			'Cache-Control': 'no-cache',
		},
	})
	.then((res) => {
		beUpdates.value = res.data.entries.sort(sortByDate);
	})
	.catch((e) => {
		ElNotification({
			title: i18n.t('notification.warning.title'),
			message: i18n.t('news.be-update.load-failed'),
			type: 'warning',
		});
		console.log(i18n.t('news.be-update.load-failed'), e);
	});
axios
	.get('https://launchercontent.mojang.com/v2/news.json', {
		headers: {
			'Cache-Control': 'no-cache',
		},
	})
	.then((res) => {
		minecraftNews.value = res.data.entries.sort(sortByDate);
	})
	.catch((e) => {
		ElNotification({
			title: i18n.t('notification.warning.title'),
			message: i18n.t('news.mc-news.load-failed'),
			type: 'warning',
		});
		console.log(i18n.t('news.mc-news.load-failed'), e);
	});

function translateNewsCategory(category: string) {
	switch (category) {
		case 'Minecraft for Windows':
			return i18n.t('news.mc-news.tag.be');
		case 'Minecraft: Java Edition':
			return i18n.t('news.mc-news.tag.je');
		case 'Minecraft Dungeons':
			return i18n.t('news.mc-news.tag.dungeons');
		case 'Minecraft Legends':
			return i18n.t('news.mc-news.tag.legends');
		default:
			console.log(category);
			return category;
	}
}

function translateNewsTag(tag: string) {
	switch (tag) {
		case 'News':
			return i18n.t('news.mc-news.tag.news');
		case 'Java Realms':
		case 'JavaRealms':
		case 'Minecraft Realms':
			return i18n.t('news.mc-news.tag.je-realms');
		case 'Marketplace':
			return i18n.t('news.mc-news.tag.marketplace');
		case 'Quick Play':
			return i18n.t('news.mc-news.tag.quick-play');
		default:
			return tag;
	}
}

function openDialog(title: string, contentPath: string) {
	dialog.value.title = title;
	dialog.value.body = null;
	dialog.value.open = true;
	axios
		.get(contentPath)
		.then((res) => {
			dialog.value.body = res.data.body;
		})
		.catch(() => {
			dialog.value.body = i18n.t('news.dialog.load-failed');
		});
}
</script>

<template>
	<Page>
		<template #breadcrumb>
			<ElBreadcrumbItem>{{ $t('sidebar.news') }}</ElBreadcrumbItem>
		</template>
		<ElCard class="news__container">
			<ElTabs v-model="activeTab" @tab-change="newsPage = 1">
				<!-- 弹出窗口 -->
				<ElDialog
					v-model="dialog.open"
					width="777px"
					:title="dialog.title"
					@close="dialog.title = dialog.body = null">
					<ElScrollbar height="500px">
						<ElText
							v-loading="!dialog.body"
							element-loading-background="rgba(255, 255, 255, 0.5)">
							<ElSkeleton v-if="!dialog.body" animated>
								<template #template>
									<ElSkeletonItem
										v-for="index in 27"
										:key="index"
										variant="p"
										:style="{
											width: randNum(40, 90) + '%',
										}" />
								</template>
							</ElSkeleton>
							<div
								v-else
								class="news__dialog"
								v-html="dialog.body" />
						</ElText>
					</ElScrollbar>
				</ElDialog>

				<!-- Minecraft Java版更新 -->
				<ElTabPane :label="$t('news.tabs.je-update')" name="je-update">
					<div v-if="!jeUpdates" class="news__loading">
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
											class="news__card-img"
											style="
												height: calc(100% - 80px);
												margin-bottom: 20px;
											" />
										<ElSkeletonItem
											variant="h3"
											class="news__card-title"
											style="width: 100%" />
										<ElSkeletonItem
											variant="h3"
											class="news__card-title"
											style="width: 100%" />
										<br >
										<ElSkeletonItem
											variant="p"
											class="news__card-date"
											style="width: 50%" />
									</ElCard>
								</div>
							</template>
						</ElSkeleton>
					</div>
					<div v-else class="news__tab">
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="jeUpdates.length" />
						<div class="news__cards">
							<ElCard
								v-for="item in jeUpdates.slice(
									(newsPage - 1) * 20,
									newsPage * 20,
								)"
								:key="item.version"
								class="news__card"
								@click="
									openDialog(
										item.title,
										'https://launchercontent.mojang.com/v2/' +
											item.contentPath,
									)
								">
								<ElImage
									class="news__card-img"
									:src="
										'https://launchercontent.mojang.com' +
										item.image.url
									"
									:alt="item.image.title" />
								<h3 class="news__card-title">
									{{ item.title }}
								</h3>
								<p class="news__card-date">
									{{
										new Date(item.date).toLocaleDateString()
									}}
								</p>
							</ElCard>
						</div>
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="jeUpdates.length" />
					</div>
				</ElTabPane>

				<!-- Minecraft 基岩版更新 -->
				<ElTabPane :label="$t('news.tabs.be-update')" name="be-update">
					<div v-if="!beUpdates" class="news__loading">
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
											class="news__card-img"
											style="
												height: calc(100% - 80px);
												margin-bottom: 20px;
											" />
										<ElSkeletonItem
											variant="h3"
											class="news__card-title"
											style="width: 100%" />
										<ElSkeletonItem
											variant="h3"
											class="news__card-title"
											style="width: 100%" />
										<br >
										<ElSkeletonItem
											variant="p"
											class="news__card-date"
											style="width: 50%" />
									</ElCard>
								</div>
							</template>
						</ElSkeleton>
					</div>
					<div v-else class="news__tab">
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="beUpdates.length" />
						<div class="news__cards">
							<ElCard
								v-for="item in beUpdates.slice(
									(newsPage - 1) * 20,
									newsPage * 20,
								)"
								:key="item.version"
								class="news__card"
								@click="
									openDialog(
										item.title,
										'https://launchercontent.mojang.com/v2/' +
											item.contentPath,
									)
								">
								<ElImage
									class="news__card-img"
									:src="
										'https://launchercontent.mojang.com' +
										item.image.url
									"
									:alt="item.image.title" />
								<h3 class="news__card-title">
									{{ item.title }}
								</h3>
								<p class="news__card-date">
									{{
										new Date(item.date).toLocaleDateString()
									}}
								</p>
							</ElCard>
						</div>
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="beUpdates.length" />
					</div>
				</ElTabPane>

				<!-- Minecraft新闻 -->
				<ElTabPane :label="$t('news.tabs.mc-news')" name="mc-news">
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
											class="news__card-img"
											style="
												height: calc(100% - 100px);
											" />
										<br >
										<ElSkeletonItem
											variant="h3"
											class="news__card-title"
											style="width: 100%" />
										<br >
										<ElSkeletonItem
											class="news__card-desc"
											variant="p"
											style="width: 75%" />
										<br >
										<ElSkeletonItem
											class="news__card-date"
											variant="p"
											style="width: 50%" />
									</ElCard>
								</div>
							</template>
						</ElSkeleton>
					</div>
					<div v-else class="news__tab">
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="minecraftNews.length" />
						<div class="news__cards news__cards-masonry">
							<ElCard
								v-for="item in minecraftNews.slice(
									(newsPage - 1) * 20,
									newsPage * 20,
								)"
								:key="item.id"
								class="news__card"
								@click="openUrl(item.readMoreLink)">
								<ElImage
									class="news__card-img"
									:src="
										'https://launchercontent.mojang.com/' +
										item.playPageImage.url
									"
									:alt="item.playPageImage.title" />
								<h3 class="news__card-title">
									{{ item.title }}
								</h3>
								<div class="news__card-tags">
									<el-tag type="primary"
										>{{
											translateNewsCategory(item.category)
										}}
									</el-tag>
									<el-tag v-if="item.tag" type="info"
										>{{ translateNewsTag(item.tag) }}
									</el-tag>
								</div>
								<p class="news__card-desc">
									{{ item.text }}
								</p>
								<p class="news__card-date">
									{{ item.date }}
								</p>
							</ElCard>
						</div>
						<ElPagination
							v-model:current-page="newsPage"
							layout="prev, pager, next, ->"
							:page-size="20"
							:total="minecraftNews.length" />
					</div>
				</ElTabPane>
			</ElTabs>
		</ElCard>
	</Page>
</template>

<style scoped>
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
	padding: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;
}

.news__card {
	width: 200px;
	height: 280px;
	border-radius: 10px;
	margin: 0 0 10px 0;
	flex-shrink: 0;
	cursor: pointer;
	opacity: 0;
	animation: 0.5s ease-in-out both 0.2s fadeIn;
	@media (max-width: 768px) {
		width: 100%;
		height: fit-content;
	}
}

.news__card:hover {
	scale: 1.025;
}

.news__card-img {
	position: relative;
	left: -20px;
	margin-bottom: 10px;
	width: calc(100% + 40px);
}

.news__card-title {
	font-size: var(--el-font-size-base);
	color: var(--el-text-color-primary);
	margin: 0;
}

.news__card-tags {
	display: flex;
	gap: 5px;
	justify-content: start;
	align-items: center;
	margin: 5px 0;
}

.news__card-desc {
	font-size: var(--el-font-size-extra-small);
	margin: 3px 0;
	color: var(--el-text-color-regular);
}

.news__card-date {
	margin: 0;
	color: var(--el-text-color-secondary);
	font-size: 10px;
}

.news__cards.news__cards-masonry {
	display: block;
	column-count: 5;
	column-width: 200px;
	column-gap: 10px;
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
