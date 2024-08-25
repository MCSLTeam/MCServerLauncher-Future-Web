import { hasAdminPermission } from '~/utils/auth';

/**
 * 登录验证中间件，检测是否需要登录/注册，需要就跳转
 * 管理员权限验证
 */
export default defineNuxtRouteMiddleware(async (to) => {
	if (await shouldRegister()) {
		if (to.fullPath != '/auth/register')
			return navigateTo('/auth/register', { redirectCode: 301 });
		return;
	} else {
		if (to.fullPath == '/auth/register') return abortNavigation();
	}

	if (await shouldLogin()) {
		if (to.fullPath != '/auth/login')
			return navigateTo('/auth/login', { redirectCode: 301 });
		return;
	} else {
		if (to.fullPath == '/auth/login') return abortNavigation();
	}

	// 管理员
	if (!await hasAdminPermission()){
		if (to.fullPath == "/users"){
			return abortNavigation();
		}
	}
});
