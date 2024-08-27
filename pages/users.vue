<script lang="ts" setup>
	import {getUsers,removeUser} from '~/utils/auth'
	import AddUserDialog from '~/components/sidebar/AddUserDialog.vue';
	const i18n = useI18n()

	const usersSelect = ref<any>()
	const showaddUser = ref(false);
	const handleSelectionChange = (val: any) => {
		usersSelect.value = val
	}

	function handleAddUser(){
		showaddUser.value = true
	}

	function handleDeleteUser () {
		if (usersSelect.value != null){
			if (usersSelect.value.length >= usersArray.length){
				ElMessageBox.alert( i18n.t("users.selectAllUserToDeleteMessage" ), i18n.t("users.warning"), {
					confirmButtonText: i18n.t("users.ok"),
				})
			}else{
				ElMessageBox.confirm(
					i18n.t("users.deleteUsersMessage"),
					i18n.t("users.warning"),
					{
						confirmButtonText: i18n.t("users.yes"),
						cancelButtonText: i18n.t("users.no"),
						type: 'warning',
					}
				)
					.then(() => {
						for (const i in usersSelect.value){
							removeUser(usersSelect.value[i]['username']);
						}
						ElMessage({
							type: 'success',
							message: i18n.t("users.deleteUsersSuccess"),
						})
					})
					.catch(() => {
					})
			}
		}else{
			ElMessageBox.alert( i18n.t("users.selectNoneUserToDeleteMessage" ), i18n.t("users.warning"), {
				// if you want to disable its autofocus
				// autofocus: false,
				confirmButtonText: i18n.t("users.ok"),
			})
		}
	}

	useHead({
		title: i18n.t('sidebar.users'),
	});
	const usersArray: { username: string; permissions: any; }[] = []
	const usersMap = new Map(Object.entries(await getUsers()))
	console.log(usersMap)
	usersMap.forEach((value,key) =>{
			const permissions = usersMap.get(key)['permissions']
			let per: string = ""
			for (let i=0;i<permissions.length;i++){
				per+=permissions[i]
				if (i>=0 && i<=permissions.length-2) per+='  ,  '
			}
			usersArray.push({username:key,permissions:per})
	});
	console.log(usersArray)
</script>

<template>
  <Page>
		<template #breadcrumb>
			<ElBreadcrumb-item>{{ $t('sidebar.users') }}</ElBreadcrumb-item>
		</template>
		<div class="users-button">
			<ElButton type="primary" plain size="large" @click="handleAddUser()">添加用户</ElButton>
			<ElButton type="danger" plain size="large" @click="handleDeleteUser()">删除用户</ElButton>
		</div>
		<!-- 表格 -->
		<div class="table">
			<ElTable
ref="multipleTableRef" :data="usersArray"
							 highlight-current-row
							 stripe border
							 style="width: 70%;"
							 @selection-change="handleSelectionChange">
				<el-table-column type="selection" width="55" />
				<ElTableColumn fixed label="序号" type="index" width="100"/>
				<ElTableColumn prop="username" label="用户名" width="280"/>
				<ElTableColumn prop="permissions" label="权限组" width="480"/>
			</ElTable>
		</div>
		<!-- dialog -->
		<AddUserDialog v-model="showaddUser"/>
	</Page>
</template>

<style scoped>
.users-button{
	position: sticky;
	margin-left: 10px;
}
.table{
	margin-left: 10px;
	margin-top: 10px;
}
</style>