<!-- 页脚 -->
<script setup lang="ts"></script>

<template>
	<div class="footer__container">
		<p>
			Powered by
			<a
				href="https://github.com/MCSLTeam/MCServerLauncher-Future-Web"
				target="_blank">
				MCSL Future Web
			</a>
			<!-- 备案号 -->
			<span v-if="beian != ''">
				<span v-if="useScreenWidth().isMdOrBigger()">
					&ensp;|&ensp;
				</span>
				<br v-if="useScreenWidth().value == 'sm'" >
				<a href="https://beian.miit.gov.cn/" target="_blank">
					{{ beian }}
				</a>
			</span>
		</p>
	</div>
</template>

<style scoped>
.footer__container {
	width: calc(100% - 40px);
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	padding: 20px;
}

.footer__container p {
	margin: 0;
	color: var(--el-text-color-regular);
}

.footer__container a {
	color: var(--el-text-color-primary);
	transition: 0.3s ease-in-out;
	text-decoration: none;
}

.footer__container a:hover {
	color: var(--el-color-primary);
}
</style>
