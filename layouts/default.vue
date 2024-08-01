<script setup lang="ts">
import LoadingStatusEnum from '~/utils/enums/loadingStatusEnum';
</script>

<template>
	<div class="default-layout__max-screen">
		<transition name="fade" mode="out-in">
			<div
				v-show="
					mcslLoadingStatus.getLoadingStatus().value ==
					LoadingStatusEnum.LOADING
				"
				class="default-layout__loading">
				<img :src="getLogoSrc()" alt="" >
				<h1>
					{{ $t('app.name') }}
					<span>{{ $t('app.name.suffix') }}</span>
				</h1>
				<div>
					<div
						v-loading="true"
						class="default-layout__loading-icon" />
					<p class="default-layout__loading-text">
						{{ mcslLoadingStatus.getMessage() }}
					</p>
				</div>
			</div>
		</transition>
		<div
			v-show="
				mcslLoadingStatus.getLoadingStatus().value ==
				LoadingStatusEnum.SUCCESS
			"
			class="default-layout__max-screen">
			<ElContainer class="default-layout__max-screen">
				<Sidebar />
				<slot />
			</ElContainer>
		</div>
	</div>
</template>

<style scoped>
.default-layout__loading {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	gap: 1rem;
}

.default-layout__loading h1 {
	margin: 0;
	font-size: 3rem;
	text-align: center;
}

.default-layout__loading > div {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 1rem;
}

.default-layout__loading img {
	width: 7rem;
}

.default-layout__loading > h1 {
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	@media (max-width: 768px) {
		font-size: 2rem;
	}
}

.default-layout__loading > h1 span {
	font-weight: bold;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-primary-dark-2)
	);
	background-clip: text;
}

.default-layout__loading > div p {
	width: 7rem;
	color: var(--el-text-color-regular);
}

.default-layout__loading-icon {
	padding: 25px;
}

.default-layout__loading-icon > * {
	background-color: transparent;
}

.default-layout__loading-text {
	width: 100% !important;
}

.default-layout__max-screen {
	width: 100%;
	height: 100%;
}
</style>
