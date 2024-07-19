<script lang="ts" setup>
import type { SimpleTask } from '~/utils/tasks';

const visible = defineModel({
	type: Boolean,
	required: true,
});

function getTaskStatus(task: SimpleTask) {
	switch (task.status.value) {
		case TaskStatus.Executing:
			return '';
		case TaskStatus.Done:
			return 'success';
		case TaskStatus.Fail:
			return 'exception';
	}
}
</script>

<template>
	<ElDialog
		v-model="visible"
		:title="$t('sidebar.tasks')"
		width="600px"
		@close="visible = false">
		<ElEmpty v-if="tasks.length === 0" :description="$t('tasks.empty')" />
		<ElScrollbar v-else class="task-dialog__scrollbar" height="500px">
			<ElCard
				v-for="task in tasks"
				:key="task.id"
				class="task-dialog__card">
				<h3>{{ task.name }}</h3>
				<h4>{{ task.desc }}</h4>
				<sup>{{ $t('tasks.id') + task.id }}</sup>
				<p class="status">
					{{ $t('tasks.status') }}
					<span :class="['task-dialog__status-' + task.status]">
						{{ $t('tasks.status.' + task.status) }}
					</span>
				</p>
				<ElProgress
					v-if="task instanceof ProgressTask"
					:percentage="task.progress.value"
					:status="getTaskStatus(task)" />
				<ElProgress
					v-else
					:percentage="50"
					:indeterminate="true"
					:duration="1"
					:show-text="false"
					:status="getTaskStatus(task)" />
			</ElCard>
		</ElScrollbar>
	</ElDialog>
</template>

<style scoped>
.task-dialog__scrollbar {
	gap: 10px;
}

.task-dialog__card {
	width: calc(100% - 20px);
	height: 150px;
	border-radius: 10px;
	margin: 10px;
	flex-shrink: 0;
	opacity: 0;
	animation: fadeIn 0.5s 0.2s both ease-in-out;
}

.task-dialog__card h3 {
	font-size: var(--el-font-size-extra-large);
	color: var(--el-text-color-primary);
	font-weight: var(--el-font-weight-primary);
	margin: 0;
}

.task-dialog__card h4 {
	font-size: var(--el-font-size-medium);
	margin: 3px 0;
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-regular);
	user-select: auto;
	-webkit-user-select: auto;
	-moz-user-select: auto;
	-ms-user-select: auto;
}

.task-dialog__card sup {
	margin: 0;
	color: var(--el-text-color-secondary);
	font-size: var(--el-font-size-extra-small);
}

.task-dialog__card p {
	margin: 5px 0;
	color: var(--el-text-color-regular);
}

.task-dialog__-card .task-dialog__status-0 {
	color: var(--el-color-success);
}

.task-dialog__card .task-dialog__status-1 {
	color: var(--el-color-primary);
}

.task-dialog__card .task-dialog__status-2 {
	color: var(--el-color-error);
}
</style>
