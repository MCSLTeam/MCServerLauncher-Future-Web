export default defineNuxtRouteMiddleware(async (to) => {
    if (await shouldRegister()) {
        if (to.fullPath != '/auth/register')
            return navigateTo('/auth/register');
        return;
    } else {
        if (to.fullPath == '/auth/register')
            return navigateTo('/');
    }

    if (await shouldLogin()) {
        if (to.fullPath != '/auth/login')
            return navigateTo('/auth/login');
        return;
    } else {
        if (to.fullPath == '/auth/login')
            return navigateTo('/');
    }
});
