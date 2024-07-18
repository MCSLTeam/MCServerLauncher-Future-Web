const token = useLocalStorage('token', null);
const tokenSession = useSessionStorage('token', null);
let tokenExpires: Date | null = null;
let adminRegistered: boolean = false;

export async function shouldRegister() {
	if (!adminRegistered) {
		adminRegistered = (await $fetch('/api/auth/hasAdmin')).data.has;
	}
	return !adminRegistered;
}

export async function shouldLogin() {
	return adminRegistered && !(await isTokenValid());
}

export async function isTokenValid() {
	if (token.value != null) {
		if (tokenExpires != null && tokenExpires.getTime() < Date.now())
			return false;
		else if (tokenExpires == null) await refreshTokenExpire();
		return tokenExpires != null && tokenExpires.getTime() - Date.now() > 0;
	} else if (tokenSession.value != null) {
		return await refreshTokenExpire();
	} else {
		return false;
	}
}

async function refreshTokenExpire() {
	const expire = await $fetch('/api/auth/verifyToken', {
		method: 'POST',
		body: {
			token: getToken(),
		},
	});
	if (expire.status == 'ok') {
		if (token.value) {
			tokenExpires = new Date(expire.data.expire);
		}
		return true;
	} else {
		ElMessage({
			message: useNuxtApp().$i18n.t('login.failed.token', {
				reason: expire.message,
			}),
			type: 'warning',
		});
		await logout();
		return false;
	}
}

export async function registerAdmin(
	username: string,
	password: string,
	successCallback: () => void = () => {},
	errorCallback: (message: string) => void = () => {},
) {
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

export async function login(
	username: string,
	password: string,
	rememberMe: boolean = false,
	successCallback: (token: string) => void = () => {},
	errorCallback: (message: string) => void = () => {},
) {
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
		if (rememberMe) {
			tokenSession.value = null;
			token.value = data.data.token;
			await refreshTokenExpire();
		} else {
			token.value = tokenExpires = null;
			tokenSession.value = data.data.token;
		}
		await useRouter().push('/');
	} else {
		errorCallback(data.message);
		await logout();
	}
}

export async function logout() {
	token.value = tokenExpires = tokenSession.value = null;
	await useRouter().push('/auth/login');
}

export function getToken() {
	return token.value ?? tokenSession.value;
}
