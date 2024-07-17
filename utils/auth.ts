export const token = useLocalStorage('token', null);
export const tokenExpires = useLocalStorage('tokenExpires', null);
let trustTokenExpires = false;
let adminRegistered: boolean = false;

export async function shouldRegister() {
    if (!adminRegistered) {
        adminRegistered = (await $fetch('/api/auth/hasAdmin')).data.has
    }
    return !adminRegistered;
}

export async function shouldLogin() {
    return adminRegistered && !await isTokenValid();
}

export async function isTokenValid() {
    if (token.value == null || tokenExpires.value == null || new Date(tokenExpires.value).getTime() - Date.now() < 0)
        return false;
    if (!trustTokenExpires) await refreshTokenExpire();
    return new Date(tokenExpires.value).getTime() - Date.now() > 0;
}

export async function refreshTokenExpire() {
    const expire = await $fetch('/api/auth/verifyToken', {
        method: 'POST',
        body: {
            token: token.value,
        },
    })
    if (expire.status == 'ok') {
        tokenExpires.value = expire.data.expire;
        trustTokenExpires = true;
    } else {
        ElMessage({
            message: useNuxtApp().$i18n.t('message.token-expired'),
            type: 'warning',
        })
        token.value = null;
        tokenExpires.value = null;
    }
}

export async function registerAdmin(username: string, password: string, successCallback: () => void = () => {
}, errorCallback: (message: string) => void = _ => {
}) {
    const data = await $fetch('/api/auth/registerAdmin', {
        method: 'POST',
        body: {
            username: username,
            password: password,
        },
    });
    if (data.status == 'ok') {
        successCallback();
        await useRouter().push('/auth/login');
    } else {
        errorCallback(data.message);
    }
    await shouldRegister();
}

export async function login(username: string, password: string, rememberMe: boolean = false, successCallback: (token: string) => void = _ => {
}, errorCallback: (message: string) => void = _ => {
}) {
    const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
            username: username,
            password: password,
            rememberMe: rememberMe,
        },
    });
    if (data.status == 'ok') {
        successCallback(data.data.token);
        token.value = data.data.token;
        await refreshTokenExpire();
        await useRouter().push('/');
    } else {
        errorCallback(data.message)
        await logout();
    }
}

export async function logout() {
    token.value = tokenExpires.value = null;
}