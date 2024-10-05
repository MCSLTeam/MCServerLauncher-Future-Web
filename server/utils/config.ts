import {nanoid} from 'nanoid';

export interface Config {
	auth: {
		secret: string;
		rememberMeExpire: string;
		expire: string;
	};
	agreedEula: boolean;
	beian: string;
	siteTitle: string;
	resourcepacks: {
		url: string;
		enabled: boolean;
		type: 'local' | 'remote' | 'system';
	}[];
}

/**
 * 默认配置文件
 */
export const defaultConfig: Config = {
	auth: {
		secret: nanoid(128), // 私钥
		rememberMeExpire: '30d', // 记住我的token有效期
		expire: '1d', // 不记住我的token有效期
	},
	agreedEula: false,
	beian: '',
	siteTitle: 'MCSL Future Web',
	resourcepacks: [
		{
			url: 'plugin-resource',
			enabled: true,
			type: 'system',
		},
	],
};

const load = loadConfig();

/**
 * 如果配置文件不存在保存配置文件
 */
export async function saveDefaultConfig() {
	// 判断是否存在
	if (!(await storage.hasItem('config.json'))) {
		await storage.setItem('config.json', defaultConfig);
		console.warn('Config does not exist! Generating new config!');
	}
}

/**
 * 加载配置文件
 */
export async function loadConfig() {
	// 确保配置文件存在
	await saveDefaultConfig();
	let config = await storage.getItem('config.json');
	// 校验配置文件格式
	if (typeof config !== 'object') {
		config = defaultConfig;
		console.warn('Wrong config format! Using default config!');
	}
	// 填充缺失的配置项
	fillMissingValues(config, defaultConfig);
	console.log('Config loaded');
	await saveConfig(config);
}

/**
 * 保存配置文件
 * @param config - 配置文件
 */
export async function saveConfig(config: any) {
	await saveDefaultConfig();
	await storage.setItem('config.json', config);
	console.log('Saved config!');
}

/**
 * 填充缺失的配置文件
 * @param config - 配置文件（中的一个对象）
 * @param defaultConfig - 默认配置文件（中的一个对象）
 * @param parentKey - 父级键，供日志输出使用
 */
function fillMissingValues(
	config: any,
	defaultConfig: any,
	parentKey?: string,
) {
	for (const key in defaultConfig) {
		if (!(key in config)) {
			// 键缺失
			config[key] = defaultConfig[key];
			console.warn(
				'Missing key "' +
					(parentKey == null ? '' : parentKey + '.') +
					key +
					'" in config! Defaulting to: ',
				defaultConfig[key],
			);
		} else if (typeof config[key] !== typeof defaultConfig[key]) {
			// 值类型不同
			config[key] = defaultConfig[key];
			console.warn(
				'Wrong value type for key "' +
					(parentKey == null ? '' : parentKey + '.') +
					key +
					'"! Defaulting to: ',
				defaultConfig[key],
			);
		} else if (typeof defaultConfig[key] == 'object') {
			// 值是对象，函数递归
			fillMissingValues(
				config[key],
				defaultConfig[key],
				parentKey == null ? key : parentKey + '.' + key,
			);
		}
	}
	return config;
}

/**
 * 获取配置文件
 * @returns 配置文件
 */
export async function getConfig(): Promise<Config> {
	await load;
	return await storage.getItem('config.json');
}
