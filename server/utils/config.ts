import { nanoid } from 'nanoid';

const defaultConfig = {
	auth: {
		secret: nanoid(128), // 私钥
		rememberMeExpire: '30d', // 记住我的token有效期
		expire: '1d', // 不记住我的token有效期
	},
};

let config: typeof defaultConfig | null = null;
const load = loadConfig();

export async function saveDefaultConfig() {
	// 判断是否存在
	if (!(await storage.hasItem('config.json'))) {
		await storage.setItem('config.json', defaultConfig);
		console.warn('配置文件不存在！已创建新配置文件！');
	}
}

export async function loadConfig() {
	// 确保config存在
	await saveDefaultConfig();
	config = await storage.getItem('config.json');
	// 校验config格式
	if (typeof config !== 'object') {
		config = defaultConfig;
		console.warn('配置文件格式错误！已重置为默认配置文件！');
	}
	fillMissingValues(config, defaultConfig);
	console.log('已加载配置文件');
	await saveConfig();
}

export async function saveConfig() {
	await saveDefaultConfig();
	await storage.setItem('config.json', config);
	console.log('已保存配置文件');
}

function fillMissingValues(
	config: any,
	defaultConfig: any,
	parentKey: string | null = null,
) {
	for (const key in defaultConfig) {
		// 默认配置文件中的key在config中没有
		if (!(key in config)) {
			config[key] = defaultConfig[key];
			console.warn(
				'配置文件缺失键“' +
					(parentKey === null ? '' : parentKey + '.') +
					key +
					'”！已重置为：',
				defaultConfig[key],
			);
			// 默认配置文件中的类型和config中的类型不统一
		} else if (typeof config[key] !== typeof defaultConfig[key]) {
			config[key] = defaultConfig[key];
			console.warn(
				'配置文件中键“' +
					(parentKey === null ? '' : parentKey + '.') +
					key +
					'”的值类型错误！已重置为：',
				defaultConfig[key],
			);
			// 这个key对应的值可能包含下一级
		} else if (typeof defaultConfig[key] === 'object') {
			fillMissingValues(
				config[key],
				defaultConfig[key],
				parentKey === null ? key : parentKey + '.' + key,
			);
		}
	}
	return config;
}

export async function getConfig() {
	await load;
	if (!config) return defaultConfig;
	return config;
}
