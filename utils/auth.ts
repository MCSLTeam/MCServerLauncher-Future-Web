const tokenLocalStorage = useLocalStorage('token', null);
const tokenSessionStorage = useSessionStorage('token', null);
let tokenExpires: Date | null = null;
let adminRegistered: boolean = false;
let username: string | null = null;

/**
 * 判断是否需要注册（管理员已注册）
 * @returns 是否需要注册
 */
export async function shouldRegister() {
	if (!adminRegistered) {
		adminRegistered = (await $fetch('/api/auth/hasAdmin')).data.has;
	}
	return !adminRegistered;
}

/**
 * 判断是否需要登录（已注册且无令牌/令牌无效）
 * @returns 是否需要登录
 */
export async function shouldLogin() {
	return !(await shouldRegister()) && !(await isTokenValid());
}

/**
 * 判断令牌是否有效
 * @returns 是否有效
 */
export async function isTokenValid() {
	// 无令牌
	if (!getToken()) {
		return false;
	}
	// 令牌有效期不存在，获取令牌有效期
	if (!tokenExpires) {
		if (!(await refreshTokenExpire())) {
			// 令牌无效
			return false;
		}
	} else if (!tokenExpires || tokenExpires.getTime() < Date.now()) {
		// 令牌有效期存在，但过期
		return false;
	}
	return true;
}

/**
 * 获取并刷新令牌有效期
 * @returns 令牌是否有效
 */
async function refreshTokenExpire() {
	const expire = await $fetch('/api/auth/verifyToken', {
		method: 'POST',
		body: {
			token: getToken(),
		},
	});
	if (expire.status == 'ok') {
		// 有效，记录信息
		tokenExpires = new Date(expire.data.expire);
		username = expire.data.username;
		return true;
	} else {
		// 无效，登出
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

/**
 * 注册管理员
 * @param username - 用户名
 * @param password - 密码
 * @param successCallback - 注册成功回调
 * @param errorCallback - 注册失败回调
 */
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
		// 注册成功
		successCallback();
		await useRouter().push('/auth/login');
	} else {
		// 注册失败
		errorCallback(data.message);
	}
	// 登出并跳转登录页面
	await logout();
}

/**
 * 判断用户是否有权限
 * @param permission - 权限名称
 * @returns 是否拥有权限
 */
export async function hasPermission(permission: string): Promise<boolean> {
	const data = await $fetch('/api/auth/hasPermission', {
		method: 'POST',
		body: {
			token: getToken(),
			permission: permission,
		},
	});
	return data.status == 'ok' && data.data.has;
}

/**
 * 登录
 * @param username - 用户名
 * @param password - 密码
 * @param rememberMe - 是否记住
 * @param successCallback - 登录成功回调
 * @param errorCallback - 登录失败回调
 */
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
		// 登录成功
		successCallback(data.data.token);
		if (rememberMe) {
			// 记住此设备，数据长期存储到localstorage
			tokenSessionStorage.value = null;
			tokenLocalStorage.value = data.data.token;
			await refreshTokenExpire();
		} else {
			// 不记住此设备，数据短期存储到sessionStorage
			tokenLocalStorage.value = tokenExpires = null;
			tokenSessionStorage.value = data.data.token;
		}
		await refreshTokenExpire();
		await useRouter().push('/');
	} else {
		// 登录失败，登出
		errorCallback(data.message);
		await logout();
	}
}

/**
 * 登出
 */
export async function logout() {
	tokenLocalStorage.value = tokenExpires = tokenSessionStorage.value = null;
	await useRouter().push('/');
}

/**
 * 获取令牌
 * @returns 令牌
 */
export function getToken(): string | null {
	return tokenLocalStorage.value ?? tokenSessionStorage.value;
}

/**
 * 获取用户名
 * @returns 用户名
 */
export function getUsername() {
	return username;
}
