<!-- 登录/注册页面布局 -->
<script setup lang="ts">
import {getLogoSrc, randNum, sleep} from "@repo/commons/src/utils/common";
import {canHideOverlay} from "@repo/commons/src/utils/loader";
import LoadingOverlay from "@repo/commons/src/components/LoadingOverlay.vue";
import FancyBackground from "@repo/commons/src/components/FancyBackground.vue";
import PageFooter from "@repo/commons/src/components/page/PageFooter.vue";

const icon = ref();
const iconX = ref(0);
const iconY = ref(0);
const item = ref<string>('web');
const showItem = ref<boolean>(true);
let itemInterval: any;

async function onMouseMove(event: MouseEvent) {
	const rect = icon.value.getBoundingClientRect();
	const centerX = rect.x + rect.width / 2;
	const centerY = rect.y + rect.height / 2;
	const rangeX = [
		centerX - rect.width / 2 - 50,
		centerX + rect.width / 2 + 50,
	];
	const rangeY = [
		centerY - rect.height / 2 - 50,
		centerY + rect.height / 2 + 50,
	];
	const mouseX = event.clientX;
	const mouseY = event.clientY;
	if (
		rangeX[0] < mouseX &&
		mouseX < rangeX[1] &&
		rangeY[0] < mouseY &&
		mouseY < rangeY[1]
	) {
		iconX.value = (mouseX - centerX) / (rangeX[1] - centerX);
		iconY.value = (mouseY - centerY) / (rangeY[1] - centerY);
	} else {
		iconX.value = iconY.value = 0;
	}
}

const icons: Record<string, string> = {
	web: 'fa-globe',
	jwt: 'fa-key',
	ootb: 'fa-download',
	'element-plus': 'fa-paint-roller',
	daemon: 'fa-server',
	performance: 'fa-bolt',
	i18n: 'fa-language',
	secure: 'fa-lock',
	ease: 'fa-square-plus',
};

onMounted(() => {
	window.addEventListener('mousemove', onMouseMove);
	itemInterval = setInterval(async () => {
		showItem.value = false;
		await sleep(500);
		let temp;
		do {
			temp = Object.keys(icons)[randNum(Object.keys(icons).length)]!;
		} while (temp == item.value);
		item.value = temp;
		await sleep(500);
		showItem.value = true;
	}, 6000);
});

onUnmounted(() => {
	window.removeEventListener('mousemove', onMouseMove);
	clearInterval(itemInterval);
});
</script>

<template>
	<div class="auth__max-screen">
		<LoadingOverlay />
		<div v-show="canHideOverlay" class="auth__max-screen">
			<FancyBackground light="5" />
			<div class="auth__container auth__max-screen">
				<div class="auth__left">
					<div class="auth__logo">
						<img :src="getLogoSrc()" alt="logo" >
						<h1>
							{{ $t('app.name.abbr') }}
							<span>{{ $t('app.name.future') }}</span>
						</h1>
					</div>
					<div
						class="auth__side"
						:style="{ opacity: showItem ? 1 : 0 }">
						<i
							ref="icon"
							class="fa"
							:class="[icons[item]]"
							:style="{
								transform: `translate(${iconX * 10}px, ${iconY * 10}px) rotateX(${iconY * 15}deg) rotateY(${-iconX * 15}deg)`,
								transition:
									iconX == 0 && iconY == 0
										? '0.3s ease-in-out'
										: 'scale 0.3s ease-in-out, 0.1s linear',
								scale: iconX == 0 && iconY == 0 ? '1' : '1.07',
								filter:
									iconX == 0 && iconY == 0
										? 'drop-shadow(0 0 12px var(--shadow-small))'
										: `drop-shadow(${iconX * 15}px ${iconY * 15}px 12px var(--shadow-big))`,
							}" />
						<h2>{{ $t('auth.side.' + item + '.title') }}</h2>
						<h3>{{ $t('auth.side.' + item + '.desc') }}</h3>
					</div>
				</div>
				<ElCard class="auth__right" body-class="auth__card-body">
					<div class="auth__logo">
						<img :src="getLogoSrc()" alt="logo" >
						<h1>
							{{ $t('app.name.abbr') }}
							<span>{{ $t('app.name.future') }}</span>
						</h1>
					</div>
					<div class="auth__content">
						<slot />
					</div>
					<PageFooter class="auth__footer" />
				</ElCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
.auth__max-screen {
	width: 100%;
	height: 100%;
}

.auth__left {
	padding: 1rem;
	width: 40%;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	height: calc(100% - 2rem);
	@media (max-width: 768px) {
		display: none;
	}
}

.auth__right {
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 3rem 0 0 3rem;
	padding: 1rem;
	width: 60%;
	height: calc(100% - 2rem);
	animation: 0.5s ease-in-out fadeInRight;
	@media (max-width: 768px) {
		width: 100%;
		border-radius: 0;
		animation: none;
	}
}

@media (min-width: 768px) {
	.auth__right .auth__logo {
		display: none;
	}
}

.auth__container {
	position: absolute;
	display: flex;
	z-index: 1;
}

.auth__logo {
	height: 7rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	margin: 1rem;
	@media (min-width: 768px) {
		position: absolute;
		top: 0;
		z-index: 10;
	}
}

.auth__logo img {
	height: 7rem;
	@media (max-width: 768px) {
		height: 5rem;
	}
}

.auth__logo h1 {
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	font-size: 2.5rem;
	@media (max-width: 768px) {
		font-size: 2rem;
	}
}

.auth__logo h1 span {
	font-weight: bold;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-primary-dark-2)
	);
	background-clip: text;
}

.auth__footer {
	padding: 0;
	width: 100%;
}

.auth__side {
	--shadow-small: rgba(0, 0, 0, 0.1);
	--shadow-big: rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin: 110px 0 0 0;
	transition: 0.5s ease-in-out;
}

.dark .auth__side {
	--shadow-small: rgba(255, 255, 255, 0.1);
	--shadow-big: rgba(255, 255, 255, 0.2);
}

.auth__side i {
	font-size: 160px;
	margin: 1rem;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-purple)
	);
	background-clip: text;
	transition: 0.3s ease-in-out;
	transform: rotate3d(0, 0, 1, 360deg);
}

.auth__side h2 {
	margin: 0;
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	font-size: 1.75rem;
}

.auth__side h3 {
	margin: 0;
	white-space: pre-wrap;
	text-align: center;
	font-weight: normal;
	font-size: 1.1rem;
	color: var(--el-text-color-regular);
}

.auth__content {
	width: 100%;
	height: calc(100% - var(--el-card-padding));
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
</style>

<style>
@media (min-width: 768px) {
	.auth__card-body {
		width: 100%;
		height: 100%;
	}
}
</style>
