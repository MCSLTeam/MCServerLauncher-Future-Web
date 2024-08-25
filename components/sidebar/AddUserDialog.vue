<script setup lang="ts">
import { addUser } from '~/utils/auth';

const i18n = useI18n();
const addUserDialog = defineModel({
	type: Boolean,
	required: true,
});
const formLabelWidth = '140px'

const form = reactive({
	username: '',
	password: '',
	password2: '',
	permissions: '',
	permissionsArray: [],
})

function addButtonClick(){
	addUserDialog.value = false;
	if (form.password!=form.password2){
		ElMessageBox.alert( i18n.t("users.addUserPasswordErrorMessage" ), i18n.t("users.warning"), {
			// if you want to disable its autofocus
			// autofocus: false,
			confirmButtonText: i18n.t("users.ok"),
		})
	}else{
		console.log(addUser(form.username,form.password,form.permissionsArray));
	}
}

function toArrayPer(permissions: string){
	const permissionsArray = permissions.split(",");
	return permissionsArray;
}

</script>

<template>
	<ElDialog v-model="addUserDialog" title="添加用户" width="500">
		<ElForm :model="form">
			<ElFormItem required label="用户名" :label-width="formLabelWidth">
				<ElInput v-model="form.username" autocomplete="off" />
			</ElFormItem>
			<ElFormItem required label="密码" :label-width="formLabelWidth">
				<ElInput v-model="form.password"/>
			</ElFormItem>
			<ElFormItem required label="确认密码" :label-width="formLabelWidth">
				<ElInput v-model="form.password2"/>
			</ElFormItem>
			<ElFormItem label="权限" :label-width="formLabelWidth">
				<ElInput v-model="form.permissions" @input="form.permissionsArray = toArrayPer(form.permissions)"/>
			</ElFormItem>
		</ElForm>
		<template #footer>
			<div class="dialog-footer">
				<ElButton @click="addUserDialog = false">取消</ElButton>
				<ElButton type="primary" @click="addButtonClick()">
					添加！
				</ElButton>
			</div>
		</template>
	</ElDialog>
</template>

<style scoped>

</style>