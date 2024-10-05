<script setup lang="ts">
const addonWarningVisible = ref(false);
const foreverConfirmVisible = ref(false);
const i18n = useI18n();
(async () => {
	while (mcslLoadingInfo.getMessage().value != i18n.t('loading.addon')) {
		await sleep(100);
	}
	addonWarningVisible.value = true;
})();
</script>

<template>
	<!-- 加载中 -->
	<transition name="fade" mode="out-in">
		<div v-show="!canHideOverlay" class="loading-overlay__loading">
			<FancyBackground light="5" />
			<img :src="getLogoSrc()" alt="" >
			<h1>
				{{ $t('app.name') }}
				<span>{{ $t('app.name.future') }}</span>
			</h1>
			<div>
				<div v-loading="true" class="loading-overlay__loading-icon" />
				<p class="loading-overlay__loading-text">
					{{ mcslLoadingInfo.getMessage() }}
				</p>
			</div>
			<ElDialog
				v-model="addonWarningVisible"
				:title="$t('addon.confirm.title')"
				width="500px"
				:show-close="false"
				:close-on-press-escape="false"
				:close-on-click-modal="false">
				<ElText>{{ $t('addon.confirm.content') }}</ElText>

				<ElDialog
					v-model="foreverConfirmVisible"
					:title="$t('addon.confirm.confirm-forever.title')"
					width="400px">
					<ElText>{{
						$t('addon.confirm.confirm-forever.content')
					}}</ElText>
					<template #footer>
						<ElButton
							type="primary"
							@click="foreverConfirmVisible = false"
							>{{ $t('addon.confirm.confirm-forever.cancel') }}
						</ElButton>
						<ElButton
							type="danger"
							@click="
								useLoadAddon().loadForever();
								foreverConfirmVisible = false;
							">
							{{ $t('addon.confirm.confirm-forever.confirm') }}
						</ElButton>
					</template>
				</ElDialog>

				<template #footer>
					<ElButton
						type="primary"
						@click="
							useLoadAddon().doNotLoad();
							addonWarningVisible = false;
						">
						{{ $t('addon.confirm.cancel') }}
					</ElButton>
					<ElButton
						@click="
							useLoadAddon().confirmLoad();
							addonWarningVisible = false;
						"
						>{{ $t('addon.confirm.confirm') }}
					</ElButton>
					<ElButton
						type="danger"
						@click="foreverConfirmVisible = true"
						>{{ $t('addon.confirm.confirm-forever') }}
					</ElButton>
				</template>
			</ElDialog>
		</div>
	</transition>
</template>

<style scoped>
.loading-overlay__loading {
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	gap: 1rem;
	position: fixed;
	top: 0;
	left: 0;
}

.loading-overlay__loading > * {
	z-index: 114;
}

.loading-overlay__loading h1 {
	margin: 0;
	font-size: 3rem;
	text-align: center;
}

.loading-overlay__loading > div {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 1rem;
}

.loading-overlay__loading img {
	width: 7rem;
}

.loading-overlay__loading > h1 {
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	@media (max-width: 768px) {
		font-size: 2rem;
	}
}

.loading-overlay__loading > h1 span {
	font-weight: bold;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-primary-dark-2)
	);
	background-clip: text;
}

.loading-overlay__loading > div p {
	width: 7rem;
	color: var(--el-text-color-regular);
}

.loading-overlay__loading-icon {
	padding: 25px;
}

.loading-overlay__loading-icon > * {
	background-color: transparent;
}

.loading-overlay__loading-text {
	width: 100% !important;
}
</style>
