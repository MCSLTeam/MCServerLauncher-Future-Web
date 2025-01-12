<!-- 空布局 -->
<script setup lang="ts">
import {canHideOverlay} from "@repo/commons/src/utils/loader";
import LoadingOverlay from "@repo/commons/src/components/LoadingOverlay.vue";
</script>

<template>
	<div class="empty__max-screen">
		<LoadingOverlay />
		<div v-show="canHideOverlay" class="empty__max-screen">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.empty__max-screen {
	width: 100%;
	height: 100%;
}
</style>
