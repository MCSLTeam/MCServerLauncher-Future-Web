<script lang="ts" setup>
import { ref } from 'vue';
import NewInstance from './NewInstanceDialog.vue';
import TasksDialog from './TasksDialog.vue';
import SidebarLogo from '~/components/sidebar/SidebarLogo.vue';

defineProps({
	isInDrawer: {
		type: Boolean,
		required: false,
		default: false,
	},
});

const showNewInstance = ref(false);
const showTasks = ref(false);
const isMinimized = useLocalStorage('sidebar-minimized', false);
</script>

<template>
	<ElAside
		v-if="useScreenWidth().isMdOrBigger() || isInDrawer"
		class="sidebar__aside"
		:class="{
			sidebar__minimized:
				!isInDrawer && (useScreenWidth().value == 'md' || isMinimized),
			sidebar__standalone: !isInDrawer,
		}">
		<SidebarLogo v-if="!isInDrawer" />
		<div class="sidebar__menu-items">
			<div>
				<ElButton
					class="sidebar__menu-item"
					:class="{
						'sidebar__menu-item-selected':
							$router.currentRoute.value.fullPath === '/',
					}"
					@click="$router.push('/')">
					<i class="fa fa-home" /><span>{{ $t('sidebar.home') }}</span>
				</ElButton>

				<ElButton
					class="sidebar__menu-item"
					:class="{
						'sidebar__menu-item-selected':
							$router.currentRoute.value.fullPath === '/instances',
					}"
					@click="$router.push('/instances')">
					<i class="fa fa-server" /><span>{{ $t('sidebar.instances') }}</span>
				</ElButton>
				<ElButton
					class="sidebar__menu-item"
					:class="{
						'sidebar__menu-item-selected':
							$router.currentRoute.value.fullPath === '/news',
					}"
					@click="$router.push('/news')">
					<i class="fa fa-newspaper" /><span>{{ $t('sidebar.news') }}</span>
				</ElButton>
			</div>

			<div>
				<ElButton
					class="sidebar__menu-item-primary sidebar__menu-item"
					@click="showNewInstance = true">
					<i class="fa fa-plus" /><span>{{ $t('sidebar.newInstance') }}</span>
				</ElButton>
				<NewInstance v-model="showNewInstance" />
				<ElBadge
					style="width: 100%"
					type="primary"
					:offset="[-30, 22]"
					:show-zero="false"
					:value="
						tasks.filter((t) => t.status.value === TaskStatus.Executing).length
					">
					<ElButton
						class="sidebar__menu-item-secondary sidebar__menu-item"
						@click="showTasks = true">
						<i class="fa fa-tasks" /><span>{{ $t('sidebar.tasks') }}</span>
					</ElButton>
				</ElBadge>
				<TasksDialog v-model="showTasks" />
				<div class="sidebar__settings-minimize-group">
					<ElButton
						class="sidebar__menu-item"
						:class="{
							'sidebar__menu-item-selected':
								$router.currentRoute.value.fullPath === '/settings',
						}"
						@click="$router.push('/settings')">
						<i class="fa fa-gear" /><span>{{ $t('sidebar.settings') }}</span>
					</ElButton>
					<ElButton
						v-if="useScreenWidth().value == 'lg'"
						class="sidebar__menu-item sidebar__menu-item-secondary sidebar__minimize-button"
						@click="isMinimized = !isMinimized">
						<i class="fa fa-angle-left" />
					</ElButton>
				</div>
			</div>
		</div>
	</ElAside>
</template>

<style scoped>
.sidebar__aside {
	margin: 0 10px 10px 10px;
	overflow: hidden;
	width: calc(100% - 20px);
	height: calc(100% - 10px);
	padding: 0 10px 10px 10px;
}

.sidebar__aside,
.sidebar__aside * {
	transition: 0.3s ease-in-out;
}

.sidebar__standalone {
	margin-top: 10px;
	padding-top: 10px;
	width: 17%;
	height: calc(100% - 20px);
	border-radius: 10px;
	border: 1px solid var(--el-border-color);
	box-shadow: var(--el-box-shadow);
	animation: 0.5s ease-in-out fadeInUp;
}

.sidebar__minimized {
	width: 60px;
}

.sidebar__menu-item i {
	margin-right: 5px;
}

.sidebar__menu-items {
	margin-top: 20px;
	border: none;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	height: calc(100% - 68px);
}

.sidebar__minimized .sidebar__menu-items {
	height: calc(100% - 60px);
}

.sidebar__menu-item {
	width: 100%;
	height: 40px;
	border-radius: 8px;
	border: none;
	padding-left: 20px;
	margin: 2.5px 0 !important;
	justify-content: start;
}

.sidebar__minimized .sidebar__menu-item span {
	display: none;
}

.sidebar__menu-item:hover {
	color: var(--el-text-color-regular);
	background: var(--el-color-primary-light-9);
}

.sidebar__menu-item-selected {
	color: var(--el-color-primary) !important;
	background: var(--el-color-primary-light-8) !important;
}

.sidebar__menu-item-primary {
	background: var(--el-color-primary-light-7);
}

.sidebar__menu-item-primary:hover {
	background: var(--el-color-primary-light-5);
}

.sidebar__menu-item-secondary {
	background: var(--el-color-primary-light-9);
}

.sidebar__menu-item-secondary:hover {
	background: var(--el-color-primary-light-7);
}

.sidebar__minimized .sidebar__menu-item,
.sidebar__minimize-button {
	width: 40px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.sidebar__minimized .sidebar__minimize-button i {
	transform: rotate(180deg);
}

.sidebar__settings-minimize-group {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 5px;
}

.sidebar__minimized .sidebar__settings-minimize-group {
	flex-direction: column;
	gap: 0;
}
</style>
