import { nanoid } from 'nanoid';

const defaultConfig = {
	auth: {
		secret: nanoid(128),
		rememberMeExpire: '30d',
		expire: '1d',
	},
};

const storage = useStorage('db');

let config: typeof defaultConfig | null = null;
const load = loadConfig();

export async function saveDefaultConfig() {
	if (!(await storage.hasItem('config.json'))) {
		await storage.setItem('config.json', defaultConfig);
		console.warn('配置文件不存在！已创建新配置文件！');
	}
}

export async function loadConfig() {
	await saveDefaultConfig();
	config = await storage.getItem('config.json');
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
		if (!(key in config)) {
			config[key] = defaultConfig[key];
			console.warn(
				'配置文件缺失键“' +
					(parentKey === null ? '' : parentKey + '.') +
					key +
					'”！已重置为：',
				defaultConfig[key],
			);
		} else if (typeof config[key] !== typeof defaultConfig[key]) {
			config[key] = defaultConfig[key];
			console.warn(
				'配置文件中键“' +
					(parentKey === null ? '' : parentKey + '.') +
					key +
					'”的值类型错误！已重置为：',
				defaultConfig[key],
			);
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
