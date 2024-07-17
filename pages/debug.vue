<script setup lang="ts"></script>

<template>
	<ElForm>
		<h3>主题</h3>
		<ElFormItem label="扩散动画（部分浏览器不支持）">
			<ElButton @click="useDarkMode().changeTheme('light', $event)"
				>浅色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('dark', $event)"
				>深色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('auto', $event)"
				>跟随系统</ElButton
			>
		</ElFormItem>
		<ElFormItem label="中心扩散动画（部分浏览器不支持）">
			<ElButton @click="useDarkMode().changeTheme('light')">浅色模式</ElButton>
			<ElButton @click="useDarkMode().changeTheme('dark')">深色模式</ElButton>
			<ElButton @click="useDarkMode().changeTheme('auto')">跟随系统</ElButton>
		</ElFormItem>
		<ElFormItem label="渐变动画">
			<ElButton @click="useDarkMode().changeTheme('light', undefined, 'fade')"
				>浅色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('dark', undefined, 'fade')"
				>深色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('auto', undefined, 'fade')"
				>跟随系统</ElButton
			>
		</ElFormItem>
		<ElFormItem label="无动画">
			<ElButton @click="useDarkMode().changeTheme('light', undefined, 'none')"
				>浅色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('dark', undefined, 'none')"
				>深色模式</ElButton
			>
			<ElButton @click="useDarkMode().changeTheme('auto', undefined, 'none')"
				>跟随系统</ElButton
			>
		</ElFormItem>
	</ElForm>
</template>

<style scoped></style>
