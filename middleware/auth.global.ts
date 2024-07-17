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
});
