import { MESSAGE_CATALOG } from "@/lib/i18n/messages";
import { readLocalePreference } from "@/lib/i18n/storage";
import type { LocaleCode, Messages } from "@/lib/i18n/types";

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Messages)) {
      return (acc as Messages)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

/** vue-i18n 风格 fallback：当前语言 → zh-CN → en-US → key */
export function resolveLocaleMessages(locale: LocaleCode): Messages[] {
  const chain: LocaleCode[] = [locale];
  if (locale.startsWith("zh") && locale !== "zh-CN") chain.push("zh-CN");
  if (locale === "zh-TW") chain.push("zh-HK");
  if (locale === "zh-HK") chain.push("zh-TW");
  chain.push("zh-CN", "en-US");
  const seen = new Set<LocaleCode>();
  return chain
    .filter((code) => {
      if (seen.has(code)) return false;
      seen.add(code);
      return true;
    })
    .map((code) => MESSAGE_CATALOG[code]);
}

export function translate(
  locale: LocaleCode,
  key: string,
  params?: Record<string, string | number>,
): string {
  for (const messages of resolveLocaleMessages(locale)) {
    const value = getPath(messages, key);
    if (typeof value === "string") {
      return interpolate(value, params);
    }
  }
  // soft defaults when locale package has no key yet
  const soft = SOFT_DEFAULTS[key];
  if (soft) {
    let text: string;
    if (locale.startsWith("zh-MEME")) text = soft.meme ?? soft.zh;
    else if (locale.startsWith("zh")) text = soft.zh;
    else if (locale.startsWith("ja")) text = soft.ja ?? soft.en;
    else if (locale.startsWith("ru")) text = soft.ru ?? soft.en;
    else text = soft.en;
    return interpolate(text, params);
  }
  return key;
}

type SoftDefault = {
  zh: string;
  en: string;
  ja?: string;
  ru?: string;
  meme?: string;
};

const SOFT_DEFAULTS: Record<string, SoftDefault> = {
  "ui.form.ready": {
    zh: "填写正确。",
    en: "Looks good.",
    ja: "入力は正しいです。",
    ru: "Заполнено верно.",
  },
  "ui.form.invalid.generic": {
    zh: "请检查填写内容。",
    en: "Please check this field.",
  },
  "shared.navbar.core": { zh: "核心", en: "Core" },
  "shared.navbar.resources": { zh: "资源", en: "Resources" },
  "shared.navbar.support": { zh: "支持", en: "Support" },
  "shared.dashboard.welcome": {
    zh: "欢迎使用 MCSL Future",
    en: "Welcome to MCSL Future",
  },
  "shared.dashboard.subtitle.default": {
    zh: "在这里查看账户状态，并快速前往远程主机与实例管理。",
    en: "Check account status and jump to remote hosts or instances.",
  },
  "shared.dashboard.subtitle.tauri": {
    zh: "连接远程主机，管理实例生命周期与控制台。",
    en: "Connect remote hosts and manage instance lifecycle and consoles.",
  },
  "shared.instance.files.root": {
    zh: "实例目录",
    en: "Instance directory",
  },
  "shared.instance.files.parent": {
    zh: "上级目录",
    en: "Parent",
  },
  "shared.instance.files.empty": {
    zh: "此目录为空。",
    en: "This directory is empty.",
  },
  "shared.instance.files.load-failed": {
    zh: "无法读取目录",
    en: "Failed to read directory",
  },
  "shared.instance.settings.working-dir": {
    zh: "工作目录",
    en: "Working directory",
  },
  "shared.instance.settings.target": {
    zh: "启动目标",
    en: "Target",
  },
  "shared.instance.settings.java": {
    zh: "Java 路径",
    en: "Java Path",
    ja: "Java パス",
    ru: "Java-путь",
  },
  "shared.instance.settings.args": {
    zh: "启动参数",
    en: "Arguments",
  },
  "shared.instance.events.empty": {
    zh: "暂无事件规则。",
    en: "No event rules yet.",
  },
  "shared.instance.components.empty": {
    zh: "暂无组件信息。",
    en: "No component info yet.",
  },
  "shared.nodes.subtitle": {
    zh: "安全护航，只在指掌。",
    en: "Secure guardianship at your fingertips.",
  },
  "shared.nodes.list.title": { zh: "远程主机列表", en: "Node list" },
  "shared.nodes.list.empty.title": {
    zh: "尚未添加远程主机",
    en: "No nodes yet",
  },
  "shared.nodes.list.empty.desc": {
    zh: "请准备一台已运行 MCSL Daemon 的服务器，并填写主机、端口与访问令牌。",
    en: "Prepare a host running MCSL Daemon, then fill in host, port and access token.",
  },
  "shared.nodes.form.add": { zh: "添加远程主机", en: "Add node" },
  "shared.nodes.form.edit": { zh: "编辑连接", en: "Edit Connection",
    ja: "接続を編集",
    ru: "Редактировать подключение" },
  "shared.nodes.form.desc": {
    zh: "连接信息仅保存在当前浏览器，不会上传到面板服务器。",
    en: "Connection details stay in this browser.",
  },
  "shared.nodes.visibility.label": {
    zh: "可见范围",
    en: "Visibility",
  },
  "shared.nodes.visibility.all": {
    zh: "所有用户",
    en: "All users",
  },
  "shared.nodes.visibility.selected": {
    zh: "指定用户",
    en: "Selected users",
  },
  "shared.nodes.visibility.admins": {
    zh: "仅管理员",
    en: "Admins only",
  },
  "shared.nodes.visibility.usernames-placeholder": {
    zh: "用户名，逗号分隔",
    en: "Usernames, comma-separated",
  },
  "shared.nodes.status.offline": { zh: "离线", en: "Offline" },
  "shared.nodes.status.online": { zh: "在线", en: "Online" },
  "shared.nodes.status.connecting": { zh: "连接中", en: "Connecting",
    ja: "接続中",
    ru: "Связь." },
  "shared.nodes.status.reconnecting": {
    zh: "重连中",
    en: "Reconnecting",
  },
  "shared.nodes.connect.action": { zh: "连接", en: "Connect" },
  "shared.nodes.disconnect": { zh: "断开", en: "Disconnect" },
  "shared.nodes.connect.all": { zh: "全部连接", en: "Connect all" },
  "shared.nodes.saved": { zh: "远程主机已保存。", en: "Remote host saved." },
  "shared.nodes.disconnected": {
    zh: "已断开节点连接。",
    en: "Node disconnected.",
  },
  "shared.nodes.connect.test.label": { zh: "测试连接", en: "Test connection" },
  "shared.nodes.connect.test.success": {
    zh: "连接成功。",
    en: "Connected successfully.",
  },
  "shared.nodes.connect.test.failed": {
    zh: "连接失败，请检查地址、端口与访问令牌。",
    en: "Connection failed. Check host, port and token.",
  },
  "shared.nodes.token.saved": { zh: "已保存令牌", en: "Token saved" },
  "shared.nodes.token.missing": { zh: "未保存令牌", en: "No token" },
  "shared.nodes.token.optional": {
    zh: "访问令牌（留空表示不修改）",
    en: "Access token (leave blank to keep)",
  },
  "shared.nodes.token.label": { zh: "访问密钥", en: "Access token" },
  "shared.nodes.token.placeholder": {
    zh: "Daemon 提供的访问令牌",
    en: "Access token from Daemon",
  },
  "shared.instances.subtitle": {
    zh: "查看各远程主机上的服务器实例，进行启动、停止与进入控制台等操作。",
    en: "View server instances on each remote host, then start, stop, or open the console.",
  },
  "shared.instances.refresh": { zh: "刷新实例", en: "Refresh" },
  "shared.instances.open": { zh: "打开", en: "Open" },
  "shared.instances.summary": {
    zh: "显示 {instances} 个实例 · 远程主机在线 {online}/{total}",
    en: "Showing {instances} instances · remote hosts online {online}/{total}",
  },
  "shared.instances.table.name": { zh: "名称", en: "Name" },
  "shared.instances.table.type": { zh: "类型", en: "Type" },
  "shared.instances.table.status": { zh: "状态", en: "Status" },
  "shared.instances.empty.no-nodes.title": {
    zh: "还没有可管理的实例",
    en: "No instances to manage",
  },
  "shared.instances.empty.no-nodes.desc": {
    zh: "实例运行在远程主机上。请先添加并连接 MCSL Daemon 远程主机，再创建服务器。",
    en: "Instances run on remote hosts. Add and connect an MCSL Daemon host, then create a server.",
  },
  "shared.instances.empty.no-data.title": {
    zh: "当前没有实例",
    en: "No instances yet",
  },
  "shared.instances.empty.no-data.desc": {
    zh: "已保存远程主机配置。连接守护进程后，已有实例会出现在此列表；也可以立即创建新实例。",
    en: "Remote host configuration is saved. After connecting the daemon, existing instances appear here; you can also create a new one.",
  },
  "shared.instances.empty.not-connected": {
    zh: "远程主机尚未连上。请到「远程主机」连接 MCSL Daemon 后再刷新。",
    en: "Remote host is not connected. Connect MCSL Daemon under Remote Host, then refresh.",
  },
  "shared.instance.detail.connected": {
    zh: "远程主机已连接，可操作此实例。",
    en: "Remote host connected. You can control this instance.",
  },
  "shared.instance.console.empty": {
    zh: "暂无日志。启动实例或发送命令后会出现在这里。",
    en: "No logs yet. Start the instance or send a command to see output.",
  },
  "shared.instance.files.pending": {
    zh: "文件管理与高级设置将在后续版本接入。",
    en: "File manager and advanced settings will arrive in a later release.",
  },
  "shared.create.subtitle": {
    zh: "请选择欲操作的方式；完成配置后单击“继续”。",
    en: "Choose an operation, complete the configuration, then select Continue.",
  },
  "shared.create.type.mcje": {
    zh: "通用 Minecraft Java 版服务器",
    en: "Universal Minecraft Java Edition Server",
    ja: "汎用 Minecraft Java 版サーバー",
    ru: "Универсальные серверы Minecraft Java Edition",
  },
  "shared.create.type.forge": {
    zh: "Minecraft Forge 服务器",
    en: "Minecraft Forge Server",
    ja: "Minecraft Forge サーバー",
    ru: "Серверы Minecraft Forge",
  },
  "shared.create.type.neoforge": {
    zh: "Minecraft NeoForge 服务器",
    en: "Minecraft NeoForge Server",
    ja: "Minecraft NeoForge サーバー",
    ru: "Серверы Minecraft NeoForge",
  },
  "shared.create.type.fabric": {
    zh: "Minecraft Fabric 服务器",
    en: "Minecraft Fabric Server",
    ja: "Minecraft Fabric サーバー",
    ru: "Серверы Minecraft Fabric",
  },
  "shared.create.type.quilt": {
    zh: "Minecraft Quilt 服务器",
    en: "Minecraft Quilt Server",
    ja: "Minecraft Quilt サーバー",
    ru: "Серверы Minecraft Quilt",
  },
  "shared.create.type.mcbe": {
    zh: "Minecraft 基岩版服务器",
    en: "Minecraft Bedrock Edition Server",
    ja: "Minecraft 統合版サーバー",
    ru: "Серверы Minecraft Bedrock Edition",
  },
  "shared.create.type.terraria": {
    zh: "Terraria 游戏服务器",
    en: "Terraria Server",
    ja: "Terraria ゲームサーバー",
    ru: "Игровые серверы Terraria",
  },
  "shared.create.type.universal": {
    zh: "其他控制台程序",
    en: "Other Executable Programs",
    ja: "その他のコンソールプログラム",
    ru: "Другие консольные программы",
  },
  "shared.create.type.geyser": {
    zh: "Minecraft Geyser",
    en: "Minecraft Geyser",
  },
  "shared.create.type.bungeecord": {
    zh: "BungeeCord",
    en: "BungeeCord",
  },
  "shared.create.type.waterfall": {
    zh: "Waterfall",
    en: "Waterfall",
  },
  "shared.create.type.velocity": {
    zh: "Velocity",
    en: "Velocity",
  },
  "shared.create.type.travertine": {
    zh: "Travertine",
    en: "Travertine",
  },
  "shared.create.type.frpc": {
    zh: "frpc",
    en: "frpc",
  },
  "shared.create.type.mefrp": {
    zh: "ME Frp",
    en: "ME Frp",
  },
  "shared.create.type.locyanfrp": {
    zh: "LoCyanFrp",
    en: "LoCyanFrp",
  },
  "shared.create.type.openfrp": {
    zh: "OpenFrp",
    en: "OpenFrp",
  },
  "shared.create.type.mossfrp": {
    zh: "MossFrp",
    en: "MossFrp",
  },
  "shared.create.type.import": {
    zh: "导入已有实例",
    en: "Import existing instance",
  },
  "shared.create.run-command.label": {
    zh: "运行命令",
    en: "Run Command",
    ja: "実行コマンド",
    ru: "Выполните команду",
  },
  "shared.create.run-command.desc": {
    zh: "在此处输入运行命令。",
    en: "Enter the run command here.",
    ja: "ここに実行コマンドを入力してください。",
    ru: "Введите здесь команду run.",
  },
  "shared.create.need-node.title": {
    zh: "请先选择远程主机",
    en: "Select a remote host first",
  },
  "shared.create.need-node.desc": {
    zh: "创建实例前需要连接并选择一台远程主机。",
    en: "Connect and select a remote host before creating an instance.",
  },
  "shared.create.submit.blocked": {
    zh: "远程主机尚未连接成功。请到「远程主机」确认地址与令牌，并确保 MCSL Daemon 正在运行。",
    en: "Remote host is not connected. Open Remote Host, confirm address and token, and ensure MCSL Daemon is running.",
  },
  "shared.create.category.title": {
    zh: "选择类别",
    en: "Choose category",
  },
  "shared.create.category.minecraft.title": {
    zh: "Minecraft 服务器",
    en: "Minecraft Server",
    ja: "Minecraft サーバー",
    ru: "Серверы Minecraft",
  },
  "shared.create.category.minecraft.desc": {
    zh: "Java / Forge / Fabric / NeoForge / Quilt / 基岩版",
    en: "Java / Forge / Fabric / NeoForge / Quilt / Bedrock",
  },
  "shared.create.category.terraria.title": {
    zh: "Terraria 游戏服务器",
    en: "Terraria Server",
    ja: "Terraria ゲームサーバー",
    ru: "Игровые серверы Terraria",
  },
  "shared.create.category.terraria.desc": {
    zh: "泰拉瑞亚服务器（实验性）",
    en: "Terraria server (experimental)",
  },
  "shared.create.category.other.title": {
    zh: "其他控制台程序",
    en: "Other Executable Programs",
    ja: "その他のコンソールプログラム",
    ru: "Другие консольные программы",
  },
  "shared.create.category.other.desc": {
    zh: "任意控制台程序 / 通用可执行文件",
    en: "Any console app / generic executable",
  },
  "shared.create.category.frp.title": {
    zh: "快速反向代理客户端 Frpc",
    en: "Fast Reverse Proxy Client (Frpc)",
    ja: "高速リバースプロキシクライアント Frpc",
    ru: "Быстрый клиент обратного прокси Frpc",
  },
  "shared.create.category.frp.desc": {
    zh: "frpc 与第三方内网穿透客户端（功能未就绪）。",
    en: "frpc and third-party tunnel clients (not ready).",
  },
  "shared.create.category.import.title": {
    zh: "导入",
    en: "Import",
  },
  "shared.create.category.import.desc": {
    zh: "从本地目录导入已有实例（功能未就绪）。",
    en: "Import an existing instance from disk (not ready).",
  },
  "shared.create.back": { zh: "返回", en: "Back",
    ja: "戻る",
    ru: "возвращать" },
  "shared.create.finish": { zh: "继续", en: "Next",
    ja: "続けます",
    ru: "Продолжай" },
  "shared.create.step.core.title": {
    zh: "Minecraft 服务器核心",
    en: "Minecraft Server Core",
    ja: "Minecraft サーバーコア",
    ru: "Ядро сервера Minecraft",
  },
  "shared.create.step.core.desc": {
    zh: "请选择该服务器将使用的核心文件。如果不知道在哪里下载，可点击右侧按钮跳转。",
    en: "Please select the core file that this server will use. If you don't know where to download it, click the button on the right to jump.",
    ja: "このサーバーが使用するコアファイルを選択してください。ダウンロード場所がわからない場合は、右側のボタンをクリックしてジャンプできます。",
    ru: "Пожалуйста, выберите файлы ядра, которые будут использоваться сервером. Если вы не знаете, где скачать, вы можете нажать кнопку справа, чтобы прыгнуть.",
  },
  "shared.create.step.loader.title": {
    zh: "选择游戏与加载器版本",
    en: "Select game and loader versions",
  },
  "shared.create.step.loader.desc": {
    zh: "请选择该服务器将运行的 Minecraft 版本。",
    en: "Please select the version of Minecraft that this server will run.",
    ja: "このサーバーが実行する Minecraft バージョンを選択してください。",
    ru: "Пожалуйста, выберите версию Minecraft, на которой будет работать сервер.",
  },
  "shared.create.step.archive.title": {
    zh: "压缩包",
    en: "Archive",
    ja: "アーカイブ",
    ru: "Zip пакет",
  },
  "shared.create.step.archive.desc": {
    zh: "请在此处导入下载的压缩包。如果不知道在哪里下载，可点击右侧按钮跳转。",
    en: "Please import the downloaded zip file here. If you don't know where to download, click the button on the right to jump.",
    ja: "ダウンロードしたアーカイブをここにインポートしてください。ダウンロード場所がわからない場合は、右側のボタンをクリックしてジャンプできます。",
    ru: "Пожалуйста, импортируйте загруженный пакет здесь. Если вы не знаете, где скачать, вы можете нажать кнопку справа, чтобы прыгнуть.",
  },
  "shared.create.step.java.title": {
    zh: "Java 运行时",
    en: "Java Runtime",
    ja: "Java ランタイム",
    ru: "Среда выполнения Java",
  },
  "shared.create.step.java.desc": {
    zh: "Java 运行时是 Minecraft Java 服务器的必需环境。请务必选择合适的版本，防止启动失败。",
    en: "The Java runtime is required for the Minecraft Java server. Be sure to select the appropriate version to prevent startup failures.",
    ja: "Java ランタイムは Minecraft Java サーバーの必須環境です。起動の失敗を防ぐため、必ず適切なバージョンを選択してください。",
    ru: "Среда выполнения Java является обязательной средой для сервера Minecraft Java. Обязательно выберите подходящую версию, чтобы предотвратить сбои при запуске.",
  },
  "shared.create.step.jvm.title": {
    zh: "JVM 参数",
    en: "JVM Arguments",
    ja: "JVM 引数",
    ru: "Параметры JVM",
  },
  "shared.create.step.jvm.desc": {
    zh: "(可选) 可在此处添加其他 JVM 参数，一行一个。",
    en: "(Optional) You can add additional JVM arguments here, one per line.",
    ja: "(オプション) ここに他の JVM 引数を追加できます。1行に1つずつ入力してください。",
    ru: "При желании вы можете добавить сюда дополнительные параметры JVM, по одному на строку.",
  },
  "shared.create.step.jvm.no-jar-tip": {
    zh: "请勿手动添加 -jar 与核心文件名，系统会自动处理。",
    en: "Do not add -jar and the core file name; they are applied automatically.",
  },
  "shared.create.step.name.title": {
    zh: "实例名称",
    en: "Instance Name",
    ja: "インスタンス名",
    ru: "Имя экземпляра",
  },
  "shared.create.step.name.desc": {
    zh: "请勿包含特殊符号或使用非法名称。",
    en: "Do not include special symbols or use illegal names.",
    ja: "特殊記号を含めたり、不正な名前を使用したりしないでください。",
    ru: "Не используйте специальные символы и недопустимые названия.",
  },
  "shared.create.jvm-arg.add": {
    zh: "添加参数",
    en: "Add",
    ja: "引数を追加",
    ru: "Добавление параметров",
  },
  "shared.create.jvm-arg.remove": {
    zh: "删除",
    en: "Delete",
    ja: "削除",
    ru: "Удалить",
  },
  "shared.create.jvm-helper.dialog.desc": {
    zh: "配置内存、编码与优化模板，然后插入到参数列表。",
    en: "Configure memory, encoding and templates, then insert into the argument list.",
  },
  "shared.create.jvm-helper.mem.title": {
    zh: "JVM 内存堆",
    en: "JVM Memory Heap",
    ja: "JVM メモリヒープ",
    ru: "Куча памяти JVM",
  },
  "shared.create.jvm-helper.mem.desc": {
    zh: "这决定了您的 Minecraft Java 服务器将能使用多少内存。",
    en: "This determines how much memory your Minecraft Java Edition server will be able to use.",
    ja: "これにより、Minecraft Java サーバーが使用できるメモリ量が決定されます。",
    ru: "Это определяет, сколько памяти сможет использовать ваш сервер Minecraft Java.",
  },
  "shared.create.jvm-helper.encoding.desc": {
    zh: "写入 -Dfile.encoding=…，可减轻控制台乱码。",
    en: "Writes -Dfile.encoding=… to reduce console mojibake.",
  },
  "shared.create.jvm-helper.template.desc": {
    zh: "可选 GC 优化模板（勿与内存重复填写冲突）。",
    en: "Optional GC templates.",
  },
  "shared.create.jvm-helper.insert": {
    zh: "插入",
    en: "Insert",
  },
  "shared.create.jvm-helper.cancel": {
    zh: "取消",
    en: "Cancel",
  },
  "shared.create.confirm.title": {
    zh: "确认创建实例",
    en: "Confirm Instance Creation",
    ja: "インスタンス作成の確認",
    ru: "Подтверждение создания экземпляра",
  },
  "shared.create.confirm.desc": {
    zh: "您确定要创建以下实例吗？",
    en: "Are you sure you want to create the following instance?",
    ja: "以下のインスタンスを作成してもよろしいですか？",
    ru: "Вы уверены, что хотите создать следующий экземпляр?",
  },
  "shared.create.confirm.ok": {
    zh: "继续",
    en: "Next",
    ja: "続けます",
    ru: "Продолжай",
  },
  "shared.create.confirm.cancel": {
    zh: "取消",
    en: "Cancel",
    ja: "キャンセル",
    ru: "Отмена",
  },
  "shared.create.badge.partial": { zh: "实验", en: "Partial" },
  "shared.create.badge.not-ready": {
    zh: "功能未就绪",
    en: "Not ready",
  },
  "shared.create.field.name.label": { zh: "实例名称", en: "Instance Name",
    ja: "インスタンス名",
    ru: "Имя экземпляра" },
  "shared.create.field.name.placeholder": {
    zh: "请勿包含特殊符号或使用非法名称。",
    en: "Do not include special symbols or use illegal names.",
    ja: "特殊記号を含めたり、不正な名前を使用したりしないでください。",
    ru: "Не используйте специальные символы и недопустимые названия.",
  },
  "shared.create.field.core-jar.label": {
    zh: "Minecraft 服务器核心",
    en: "Minecraft Server Core",
    ja: "Minecraft サーバーコア",
    ru: "Ядро сервера Minecraft",
  },
  "shared.create.field.core-jar.hint": {
    zh: "请选择该服务器将使用的核心文件。如果不知道在哪里下载，可点击右侧按钮跳转。",
    en: "Please select the core file that this server will use. If you don't know where to download it, click the button on the right to jump.",
    ja: "このサーバーが使用するコアファイルを選択してください。ダウンロード場所がわからない場合は、右側のボタンをクリックしてジャンプできます。",
    ru: "Пожалуйста, выберите файлы ядра, которые будут использоваться сервером. Если вы не знаете, где скачать, вы можете нажать кнопку справа, чтобы прыгнуть.",
  },
  "shared.create.field.archive": {
    zh: "压缩包",
    en: "Archive",
    ja: "アーカイブ",
    ru: "Zip пакет",
  },
  "shared.create.field.mc-version": {
    zh: "Minecraft 版本",
    en: "Minecraft Version",
    ja: "Minecraft バージョン",
    ru: "Minecraft Edition",
  },
  "shared.create.field.loader-version": {
    zh: "Loader 版本",
    en: "Loader version",
  },
  "shared.create.field.select": { zh: "浏览", en: "Browse",
    ja: "参照",
    ru: "Просматривать" },
  "shared.create.field.use-mirror": {
    zh: "启用后将使用 BMCLAPI 进行下载资源，建议中国用户开启。",
    en: "After enabling this option, resources will be downloaded using BMCLAPI. Recommended for Chinese users.",
    ja: "有効にすると、リソースのダウンロードに BMCLAPI が使用されます。中国のユーザーは有効にすることをお勧めします。",
    ru: "После включения BMCLAPI будет использоваться для загрузки ресурсов, что рекомендуется для китайских пользователей.",
  },
  "shared.create.field.only-stable": {
    zh: "仅显示稳定版",
    en: "Stable only",
  },
  "shared.create.field.java.label": { zh: "Java 运行时", en: "Java Runtime",
    ja: "Java ランタイム",
    ru: "Среда выполнения Java" },
  "shared.create.field.java.select": {
    zh: "Java 路径",
    en: "Java Path",
    ja: "Java パス",
    ru: "Java-путь",
  },
  "shared.create.field.java.manual": {
    zh: "或手动填写 Java 可执行路径",
    en: "Or enter Java executable path",
  },
  "shared.create.field.java.refresh": { zh: "自动搜索", en: "Auto search",
    ja: "自動検索",
    ru: "Автоматический поиск" },
  "shared.create.field.jvm-args": { zh: "JVM 参数", en: "JVM arguments" },
  "shared.create.jvm-helper.title": {
    zh: "JVM 内存堆",
    en: "JVM Memory Heap",
    ja: "JVM メモリヒープ",
    ru: "Куча памяти JVM",
  },
  "shared.create.jvm-helper.min": { zh: "最小内存", en: "Minimum Memory",
    ja: "最小メモリ",
    ru: "Минимальный объем памяти" },
  "shared.create.jvm-helper.max": { zh: "最大内存", en: "Maximum memory",
    ja: "最大メモリ",
    ru: "Максимальный объем памяти" },
  "shared.create.jvm-helper.unit": { zh: "单位", en: "Unit" },
  "shared.create.jvm-helper.encoding.label": { zh: "编码", en: "Encoding" },
  "shared.create.jvm-helper.template.label": { zh: "参数模板", en: "Template" },
  "shared.create.jvm-helper.template.none": { zh: "无", en: "None" },
  "shared.create.jvm-helper.template.basic": { zh: "基础", en: "Basic" },
  "shared.create.jvm-helper.template.advanced": {
    zh: "进阶 G1",
    en: "Advanced G1",
  },
  "shared.create.jvm-helper.apply": {
    zh: "应用到参数框",
    en: "Apply to args",
  },
  "shared.create.status.uploading": {
    zh: "正在上传文件",
    en: "Uploading file",
    ja: "ファイルをアップロード中",
    ru: "Загрузка файла",
  },
  "shared.create.status.upload-failed": {
    zh: "文件上传失败",
    en: "Failed to upload file",
    ja: "ファイルのアップロードに失敗しました",
    ru: "Не удалось загрузить файл",
  },
  "shared.create.status.creating": {
    zh: "正在创建实例...",
    en: "Creating instance...",
    ja: "インスタンスを作成中...",
    ru: "Создание экземпляра...",
  },
  "shared.create.status.request-failed": { zh: "请求失败 {status}: {url}", en: "Request failed {status}: {url}" },
  "shared.create.status.success": {
    zh: "实例创建成功",
    en: "Instance created successfully",
    ja: "インスタンスが正常に作成されました",
    ru: "Экземпляр успешно создан",
  },
  "shared.create.status.failed": {
    zh: "创建实例失败",
    en: "Failed to create instance",
    ja: "インスタンスの作成に失敗しました",
    ru: "Не удалось создать экземпляр",
  },
  "shared.create.status.experimental": {
    zh: "此类型为实验性提交，Daemon 可能未注册对应工厂。",
    en: "Experimental type; Daemon may not have a matching factory.",
  },
  "shared.create.status.loading-versions": {
    zh: "正在加载版本列表…",
    en: "Loading versions…",
  },
  "shared.create.status.loading-java": {
    zh: "正在扫描 Java…",
    en: "Scanning Java…",
  },
  "shared.create.validation.archive": {
    zh: "请选择压缩包或程序文件",
    en: "Choose an archive or program file",
  },
  "shared.create.validation.run-or-file": {
    zh: "请填写运行命令或上传程序文件",
    en: "Enter a run command or upload a program file",
  },
  "shared.create.validation.unsupported": {
    zh: "当前类型暂不支持提交",
    en: "This type cannot be submitted yet",
  },
  "shared.create.validation.not-ready": {
    zh: "该实例类型创建流程尚未就绪（与 WPF 一致）。",
    en: "This create flow is not ready yet (same as WPF).",
  },
  "shared.resource-center.history.desc": {
    zh: "查看资源下载进度，可取消进行中的任务。",
    en: "Track resource downloads and cancel active tasks.",
  },
  "shared.resource-center.history.saved-path": {
    zh: "已保存到",
    en: "Saved to",
  },
  "shared.resource-center.history.clear": {
    zh: "清除已完成",
    en: "Clear finished",
  },
  "shared.resource-center.history.cancel": { zh: "取消", en: "Cancel" },
  "shared.resource-center.history.remove": { zh: "移除", en: "Remove" },
  "shared.resource-center.history.status.running": {
    zh: "正在下载文件...",
    en: "Downloading file...",
    ja: "ファイルをダウンロード中...",
    ru: "Загрузка файла...",
  },
  "shared.resource-center.history.status.completed": {
    zh: "下载完毕",
    en: "Download complete",
    ja: "ダウンロード完了",
    ru: "下载完毕",
  },
  "shared.resource-center.history.status.failed": {
    zh: "下载失败",
    en: "Download failed",
    ja: "ダウンロード失敗",
    ru: "下载失败",
  },
  "shared.resource-center.history.status.cancelled": {
    zh: "下载已取消",
    en: "Download cancelled",
    ja: "ダウンロードキャンセル",
    ru: "下载已取消",
  },
  "shared.resource-center.history.status.queued": {
    zh: "排队中",
    en: "Queued",
  },

  "shared.help-center.subtitle": {
    zh: "常见问题与上手指引，帮助你更快完成部署与日常运维。",
    en: "FAQs and getting-started tips for setup and day-to-day ops.",
  },
  "shared.resource-center.subtitle": {
    zh: "常用服务端核心与文档入口。下载与安装仍由你在远程主机上完成。",
    en: "Common server cores and docs. Download and install are still completed on the remote host.",
  },

  "shared.resource-center.provider.title": {
    zh: "下载源 / 常用核心",
    en: "Sources / common cores",
  },
  "shared.resource-center.provider.desc": {
    zh: "对齐 WPF 资源下载页的主内容区。当前提供常用官方下载入口；完整镜像源将在后续接入。",
    en: "Matches the WPF ResDownload main frame. Official download links for now; full providers later.",
  },
  "shared.resource-center.open-external": {
    zh: "在新标签页打开官方站点",
    en: "Open official site in a new tab",
  },
  "shared.resource-center.note": {
    zh: "下载与安装仍需在远程主机侧完成；面板不会代替 Daemon 执行安装。",
    en: "Download and install still happen on the remote host; the panel does not replace Daemon installers.",
  },
  "shared.resource-center.history.title": {
    zh: "下载历史",
    en: "Downloads",
    ja: "ダウンロード履歴",
    ru: "История скачивания",
  },
  "shared.resource-center.history.empty": {
    zh: "暂无下载历史（WPF 标题栏下载历史将在 Web 侧后续实现）。",
    en: "No download history yet (WPF title-bar history will arrive later on Web).",
  },
  "shared.help-center.getting-started": {
    zh: "快速上手",
    en: "Getting started",
  },
  "shared.help-center.faq.title": { zh: "常见问题", en: "FAQ" },
  "shared.help-center.faq.connect": {
    zh: "无法连接远程主机：检查 Daemon 是否运行、主机端口、访问令牌，以及是否使用了正确的 ws/wss。",
    en: "Cannot connect: check Daemon is running, host/port/token, and ws/wss.",
  },
  "shared.help-center.faq.create": {
    zh: "创建实例前需至少有一台已连接的远程主机；无远程主机时请先到「远程主机」添加连接。",
    en: "Creating instances needs at least one connected remote host.",
  },
  "shared.help-center.faq.console": {
    zh: "实例控制台二级页包含看板、终端、文件、事件、组件与设置，布局对齐 WPF 独立控制台窗口。",
    en: "Instance console tabs match the WPF console window: board, terminal, files, events, components, settings.",
  },
  "shared.help-center.links.title": { zh: "相关链接", en: "Links" },
  "shared.settings.subtitle": {
    zh: "调整本机控制台外观与操作偏好。这些设置保存在当前浏览器。",
    en: "Adjust local console appearance and preferences. Saved in this browser.",
  },
  "shared.settings.saved": { zh: "设置已保存", en: "Settings saved successfully" },
  "shared.settings.save": { zh: "保存", en: "Save" },
  "shared.preferences.root": { zh: "偏好设置", en: "Preferences" },
  "shared.preferences.language": { zh: "语言", en: "Language" },
  "shared.preferences.theme.root": { zh: "主题", en: "Theme" },

  "shared.nodes.refresh": { zh: "刷新", en: "Refresh" },
  "shared.nodes.search.placeholder": {
    zh: "搜索",
    en: "Search",
    ja: "設定を保存しました",
    ru: "Настройки сохранены",
  },
  "shared.nodes.search.empty.title": {
    zh: "没有匹配的远程主机",
    en: "No matching nodes",
  },
  "shared.nodes.search.empty.desc": {
    zh: "试试其他关键词，或清空搜索。",
    en: "Try another keyword, or clear the search.",
  },
  "shared.nodes.auto-refresh.label": { zh: "自动刷新", en: "Auto Refresh",
    ja: "自動更新",
    ru: "Автообновление" },
  "shared.nodes.auto-refresh.interval": {
    zh: "{sec} 秒",
    en: "{sec}s",
  },
  "shared.nodes.connect.success": {
    zh: "已连接守护进程。",
    en: "Daemon connected.",
  },
  "shared.nodes.connect.failed": {
    zh: "无法连接远程主机，请检查配置",
    en: "Could not connect to remote host, please re-check your configurations.",
    ja: "リモートホストに接続できません。設定を確認してください",
    ru: "无法连接守护进程，请检查配置。",
  },
  "shared.nodes.connect.retry": { zh: "重试连接", en: "Retry" },
  "shared.nodes.connect.scheme": { zh: "协议", en: "Scheme" },
  "shared.nodes.form.save": { zh: "保存", en: "Save" },
  "shared.nodes.delete.confirm": {
    zh: "确定要删除远程主机“{name}”吗？",
    en: "Are you sure you want to delete remote host '{name}'?",
    ja: "リモートホスト「{0}」を削除してもよろしいですか？",
    ru: "Вы уверены, что хотите удалить удаленный хост «{0}»?",
  },
  "shared.nodes.delete.success": {
    zh: "已删除远程主机",
    en: "Remote host deleted",
    ja: "リモートホストを削除しました",
    ru: "Удаленный хост удален",
  },
  "shared.nodes.status.ok": { zh: "正常", en: "OK" },
  "shared.nodes.status.error": { zh: "异常", en: "Error" },
  "shared.nodes.card.uri": { zh: "远端地址", en: "Remote Address" },
  "shared.nodes.card.status": { zh: "链接状态", en: "Connection Status",
    ja: "リモートアドレス:",
    ru: "Удаленный адрес:" },
  "shared.nodes.card.system": { zh: "操作系统", en: "System",
    ja: "システム:",
    ru: "Система:" },
  "shared.nodes.card.daemon": { zh: "节点版本", en: "Node version",
    ja: "ノードバージョン:",
    ru: "Версия узла:" },
  "shared.nodes.card.view-error": { zh: "查看错误", en: "View error" },
  "shared.nodes.resource.not-loaded": { zh: "未加载", en: "Not loaded" },
  "shared.nodes.resource.load-failed": { zh: "加载失败", en: "Load failed" },
  "shared.nodes.resource.cpu": { zh: "CPU", en: "CPU",
    ja: "CPU",
    ru: "CPU" },
  "shared.nodes.resource.memory": { zh: "内存", en: "Memory",
    ja: "メモリ",
    ru: "Память" },
  "shared.nodes.resource.drive": { zh: "磁盘", en: "Disk" },
  "shared.account.subtitle": {
    zh: "查看资料、修改密码，并管理已登录的设备会话。",
    en: "View profile, change password, and manage signed-in sessions.",
  },
  "shared.instance.console.need-connection": {
    zh: "需要连接远程主机后才能使用此功能。请先在「远程主机」中保存并连接 MCSL Daemon。",
    en: "Connect a remote host before using this feature. Save and connect MCSL Daemon under Remote Host first.",
  },
  "web.users.subtitle": {
    zh: "查看面板账号，并由管理员创建后续用户。首次安装只能注册一名管理员。",
    en: "Review panel accounts. Only the first admin is created at setup; later users are created here.",
  },
  "web.users.refresh": { zh: "刷新列表", en: "Refresh" },
  "web.users.list.title": { zh: "账号列表", en: "Accounts" },
  "web.users.list.count": {
    zh: "共 {count} 个账号",
    en: "{count} accounts",
  },
  "web.users.list.empty.title": {
    zh: "暂时看不到其他账号",
    en: "No accounts visible",
  },
  "web.users.list.empty.desc": {
    zh: "列表只显示你有权查看的账号。若你是管理员，可在右侧创建新用户。",
    en: "Only accounts you can access appear here. Admins can create users on the right.",
  },
  "web.users.list.self": { zh: "当前登录", en: "You" },
  "web.users.permissions.summary": { zh: "权限", en: "Permissions" },
  "web.users.create.title": { zh: "创建用户", en: "Create user" },
  "web.users.create.desc": {
    zh: "新用户创建后即可用该用户名登录面板。权限可按角色预设选择。",
    en: "New users can sign in with this username. Choose a permission preset.",
  },
  "web.users.create.submit": { zh: "创建账号", en: "Create account" },
  "web.users.create.success": {
    zh: "已创建用户「{username}」。",
    en: "Created user “{username}”.",
  },
  "web.users.create.error": {
    zh: "创建用户失败。",
    en: "Failed to create user.",
  },
  "web.users.create.denied.title": {
    zh: "当前账号不能创建用户",
    en: "You cannot create users",
  },
  "web.users.create.denied.desc": {
    zh: "需要管理员授予「创建用户」权限后，才能在面板内添加其他账号。",
    en: "You need the create-user permission from an admin before adding accounts.",
  },
  "web.users.preset.label": { zh: "权限角色", en: "Role" },
  "web.users.preset.desc": {
    zh: "管理员：全部权限。运维：可管理其他用户。只读：仅可查看。",
    en: "Admin: full access. Operator: manage users. Viewer: read-only.",
  },
  "web.users.preset.admin": { zh: "管理员", en: "Admin" },
  "web.users.preset.operator": { zh: "运维", en: "Operator" },
  "web.users.preset.viewer": { zh: "只读", en: "Viewer" },
  "web.users.delete.confirm": {
    zh: "确定删除用户「{username}」？其会话也会失效。",
    en: "Delete user “{username}”? Their sessions will also end.",
  },
  "web.users.delete.success": {
    zh: "已删除用户「{username}」。",
    en: "Deleted user “{username}”.",
  },
  "web.users.delete.error": {
    zh: "删除用户失败。",
    en: "Failed to delete user.",
  },
  "web.users.delete.self": {
    zh: "不能删除当前登录的账号。",
    en: "You cannot delete the signed-in account.",
  },
  "web.users.load.error": {
    zh: "无法加载用户列表。请确认已登录且具备查看权限。",
    en: "Could not load users. Sign in and check your permissions.",
  },
  "ui.common.actions": { zh: "操作", en: "Actions" },
  "ui.common.close": { zh: "关闭", en: "Close" },
  "ui.common.confirm": { zh: "确定", en: "OK" },
  "ui.common.cancel": { zh: "取消", en: "Cancel" },
  "ui.common.delete": { zh: "删除", en: "Delete" },
  "shared.nodes.title": { zh: "远程主机", en: "Remote Host",
    ja: "リモートホスト",
    ru: "守护进程" },
  "shared.nodes.tip": {
    zh: "安全护航，只在指掌。",
    en: "Secure escort, in the palm of your hand.",
    ja: "安全なエスコート、あなたの手のひらに。",
    ru: "安全护航，只在指掌。",
  },
  "shared.nodes.connect.new": { zh: "新建连接", en: "New connection" },
  "shared.nodes.auto-refresh.on": {
    zh: "自动刷新: 开",
    en: "Auto refresh: On",
    ja: "自動更新: オン",
    ru: "Автообновление: вкл.",
  },
  "shared.nodes.auto-refresh.off": {
    zh: "自动刷新: 关",
    en: "Auto refresh: Off",
    ja: "自動更新: オフ",
    ru: "Автообновление: выкл.",
  },
  "shared.nodes.connect.name.label": { zh: "备注名", en: "Comment Name",
    ja: "備考名",
    ru: "备注名" },
  "shared.nodes.connect.host.placeholder": {
    zh: "远程主机 WebSocket 地址",
    en: "Daemon WebSocket host",
  },
  "shared.nodes.connect.port.label": { zh: "端口", en: "Port" },
  "ui.common.edit": { zh: "编辑", en: "Edit" },
  "ui.common.done": { zh: "完成", en: "Done" },
  "ui.common.all": { zh: "全部", en: "All" },
  "ui.common.more": { zh: "更多", en: "More" },
  "shared.instances.table.version": { zh: "版本", en: "Version" },
  "shared.instances.sorting.search-placeholder": {
    zh: "搜索实例名称、类型或节点…",
    en: "Search name, type, or node…",
  },
  "shared.instance.console.title": { zh: "控制台", en: "Console",
    ja: "コンソール",
    ru: "控制台" },
  // 对齐 WPF BuildSystemWindowTitle: ConsoleTitle - 实例 [name] - 节点 [node]
  "shared.instance.console.title.instance": {
    zh: "实例 [{name}]",
    en: "Instance [{name}]",
    ja: "インスタンス [{name}]",
    ru: "Экземпляр [{name}]",
  },
  "shared.instance.console.title.node": {
    zh: "节点 [{name}]",
    en: "Node [{name}]",
    ja: "ノード [{name}]",
    ru: "Узел [{name}]",
  },
  "shared.instance.console.placeholder": {
    zh: "在此输入命令...",
    en: "Type command here...",
    ja: "ここにコマンドを入力...",
    ru: "Введите команду здесь...",
  },
  "shared.instance.console.send": { zh: "发送", en: "Send" },
  "shared.instance.console.feedback-tip": {
    zh: "控制台输出会实时追加。若实例未运行，无法发送命令。",
    en: "Console output appends in real time. Commands can only be sent while the instance is running.",
  },
  "shared.instance.console.pty-tip": {
    zh: "交互式 PTY 终端：直接在终端内输入，无需底部命令栏。",
    en: "Interactive PTY terminal: type in the terminal itself; no separate command bar.",
  },
  "shared.instance.console.enter-fullscreen": {
    zh: "全屏控制台",
    en: "Enter fullscreen console",
  },
  "shared.instance.console.exit-fullscreen": {
    zh: "退出全屏",
    en: "Exit fullscreen console",
  },
  "shared.instance.console.action-unavailable": {
    zh: "当前状态不可用此操作。",
    en: "This action is unavailable in the current state.",
  },
  "shared.instance.console.confirm.start": {
    zh: "确定要启动实例「{name}」吗？",
    en: "Start instance “{name}”?",
  },
  "shared.instance.console.confirm.stop": {
    zh: "确定要关闭实例「{name}」吗？",
    en: "Stop instance “{name}”?",
  },
  "shared.instance.console.confirm.restart": {
    zh: "确定要重启实例「{name}」吗？",
    en: "Restart instance “{name}”?",
  },
  "shared.instance.console.confirm.kill": {
    zh: "强制关闭会立即结束进程，可能导致数据损坏。确定强制关闭「{name}」吗？",
    en: "Force close ends the process immediately and may corrupt data. Force close “{name}”?",
  },
  "shared.download.dest.title": {
    zh: "选择下载位置",
    en: "Choose download destination",
  },
  "shared.download.dest.desc": {
    zh: "将「{name}」保存到本机，和/或推送到一个或多个守护进程。",
    en: "Save “{name}” locally and/or push it to one or more daemons.",
  },
  "shared.download.dest.local": { zh: "本机", en: "This device" },
  "shared.download.dest.local-hint": {
    zh: "使用系统保存对话框选择路径（Web / Tauri 均支持）。",
    en: "Pick a path with the system save dialog (Web and Tauri).",
  },
  "shared.download.dest.daemons": {
    zh: "守护进程",
    en: "Daemons",
  },
  "shared.download.dest.select-online": {
    zh: "全选在线",
    en: "All online",
  },
  "shared.download.dest.clear": { zh: "清除", en: "Clear" },
  "shared.download.dest.no-nodes": {
    zh: "尚未添加守护进程。请先到节点页添加并连接。",
    en: "No daemons yet. Add and connect nodes first.",
  },
  "shared.download.dest.daemon-path-hint": {
    zh: "推送到守护进程时默认保存到 caches/downloads/ 文件名（可在建实例时选用）。",
    en: "Daemon targets default to caches/downloads/{fileName} (usable when creating instances).",
  },
  "shared.download.dest.confirm": { zh: "开始下载", en: "Start download" },
  "shared.download.dest.need-upload": {
    zh: "选择守护进程时需要可用的节点连接以上传。",
    en: "Daemon destinations need an online node connection for upload.",
  },
  "shared.download.dest.upload-failed": {
    zh: "上传到守护进程失败",
    en: "Upload to daemon failed",
  },
  "shared.instance.files.back": { zh: "后退", en: "Back" },
  "shared.instance.files.forward": { zh: "前进", en: "Forward" },
  "shared.instance.files.up": { zh: "上级", en: "Up" },
  "shared.instance.files.open": { zh: "打开", en: "Open" },
  "shared.instance.files.multi-select-tip": {
    zh: "按住 Ctrl/⌘ 可多选文件。",
    en: "Hold Ctrl/⌘ to multi-select files.",
  },
  "shared.instance.files.col.name": { zh: "名称", en: "Name" },
  "shared.instance.files.col.modified": { zh: "修改日期", en: "Modified" },
  "shared.instance.files.col.type": { zh: "类型", en: "Type" },
  "shared.instance.files.col.size": { zh: "大小", en: "Size" },
  "shared.instance.files.type.folder": { zh: "文件夹", en: "Folder" },
  "shared.instance.files.type.file": { zh: "文件", en: "File" },
  "shared.instance.files.error": { zh: "无法加载目录", en: "Failed to load directory" },
  "shared.instance.events.import": { zh: "导入", en: "Import" },
  "shared.instance.events.export": { zh: "导出", en: "Export" },
  "shared.instance.events.empty-title": { zh: "这里空空如也", en: "Nothing here" },
  "shared.instance.events.empty-desc": {
    zh: "还没有事件规则，点击添加创建一条。",
    en: "No event rules yet. Add one to get started.",
  },
  "shared.instance.events.triggers": { zh: "触发器", en: "Triggers" },
  "shared.instance.events.actions": { zh: "动作", en: "Actions" },
  "shared.instance.events.on": { zh: "开", en: "On" },
  "shared.instance.events.off": { zh: "关", en: "Off" },
  "shared.instance.events.edit-title": { zh: "编辑规则", en: "Edit rule" },
  "shared.instance.events.field.name": { zh: "名称", en: "Name" },
  "shared.instance.events.field.description": { zh: "描述", en: "Description" },
  "shared.instance.events.add-trigger": { zh: "添加触发器", en: "Add trigger" },
  "shared.instance.events.add-action": { zh: "添加动作", en: "Add action" },
  "shared.instance.events.new-name": { zh: "新规则", en: "New rule" },
  "shared.instance.events.new-desc": { zh: "新规则的描述", en: "Description of the new rule" },
  "shared.instance.events.load-failed": { zh: "加载事件规则失败", en: "Failed to load event rules" },
  "shared.instance.events.save-failed": { zh: "保存事件规则失败", en: "Failed to save event rules" },
  "shared.instance.events.import-failed": { zh: "导入失败", en: "Import failed" },
  "shared.instance.components.unsupported-title": { zh: "不支持组件管理", en: "Components unsupported" },
  "shared.instance.components.unsupported-desc": {
    zh: "当前实例没有 mods 或 plugins 目录。",
    en: "This instance has no mods or plugins folder.",
  },
  "shared.instance.components.add-mod": { zh: "添加模组", en: "Add mod" },
  "shared.instance.components.add-plugin": { zh: "添加插件", en: "Add plugin" },
  "shared.instance.components.mods": { zh: "模组", en: "Mods" },
  "shared.instance.components.plugins": { zh: "插件", en: "Plugins" },
  "shared.instance.components.empty-title": { zh: "这里空空如也", en: "Nothing here" },
  "shared.instance.components.empty-mods": { zh: "还没有模组。", en: "No mods yet." },
  "shared.instance.components.empty-plugins": { zh: "还没有插件。", en: "No plugins yet." },
  "shared.instance.components.enable": { zh: "启用", en: "Enable" },
  "shared.instance.components.disable": { zh: "禁用", en: "Disable" },
  "shared.instance.components.locate": { zh: "定位", en: "Locate" },
  "shared.instance.components.locate-copied": { zh: "路径已复制", en: "Path copied" },
  "shared.instance.settings.basic-mode-notice": {
    zh: "当前实例类型为基础模式，仅可编辑名称与版本等基础字段。",
    en: "Basic mode: only basic fields are editable for this instance type.",
  },
  "shared.instance.settings.jvm-args": { zh: "JVM 参数", en: "JVM arguments" },
  "shared.instance.settings.add-arg": { zh: "添加参数", en: "Add argument" },
  "shared.instance.settings.no-jar-arg-warn": {
    zh: "参数列表中似乎没有 .jar 入口。",
    en: "No .jar entry found in JVM arguments.",
  },
  "shared.instance.settings.force-rerun": {
    zh: "强制重新运行安装器",
    en: "Force re-run installer",
  },
  "shared.instance.settings.force-rerun-desc": {
    zh: "下次启动时重新执行 Forge/NeoForge 类安装流程。",
    en: "Re-run the Forge-family installer on next start.",
  },
  "ui.common.copy": { zh: "复制", en: "Copy" },
  "ui.common.add": { zh: "添加", en: "Add" },
  "ui.common.loading": { zh: "加载中…", en: "Loading…" },
  "ui.common.refresh": { zh: "刷新", en: "Refresh" },
  "ui.common.save": { zh: "保存", en: "Save" },
  "shared.instance.files.editor-title": { zh: "文件编辑器", en: "File editor" },
  "shared.instance.files.editor-desc": { zh: "编辑守护进程上的文本文件，保存后写回。", en: "Edit a text file on the daemon and write it back on save." },
  "shared.instance.files.editor-unsaved": { zh: "有未保存的更改，确定关闭？", en: "Discard unsaved changes and close?" },
  "shared.instance.files.editor-dirty": { zh: "未保存", en: "Unsaved changes" },
  "shared.instance.files.editor-clean": { zh: "已同步", en: "In sync" },
  "shared.instance.files.editor-large-warn": { zh: "文件较大，编辑可能较慢。", en: "Large file — editing may be slow." },
  "shared.instance.files.editor-binary-confirm": { zh: "此文件可能不是纯文本，仍要打开编辑吗？", en: "This file may be binary. Open in editor anyway?" },
  "shared.instance.files.editor-load-failed": { zh: "加载文件失败", en: "Failed to load file" },
  "shared.instance.files.editor-save-failed": { zh: "保存文件失败", en: "Failed to save file" },
  "shared.instance.files.editor-menu-file": { zh: "文件", en: "File" },
  "shared.instance.files.editor-menu-edit": { zh: "编辑", en: "Edit" },
  "shared.instance.files.editor-menu-format": { zh: "格式", en: "Format" },
  "shared.instance.files.editor-menu-view": { zh: "查看", en: "View" },
  "shared.instance.files.editor-reload": { zh: "重新加载", en: "Reload" },
  "shared.instance.files.editor-encoding": { zh: "编码", en: "Encoding" },
  "shared.instance.files.editor-exit": { zh: "退出", en: "Exit" },
  "shared.instance.files.editor-undo": { zh: "撤销", en: "Undo" },
  "shared.instance.files.editor-redo": { zh: "重做", en: "Redo" },
  "shared.instance.files.editor-cut": { zh: "剪切", en: "Cut" },
  "shared.instance.files.editor-copy": { zh: "复制", en: "Copy" },
  "shared.instance.files.editor-paste": { zh: "粘贴", en: "Paste" },
  "shared.instance.files.editor-select-all": { zh: "全选", en: "Select all" },
  "shared.instance.files.editor-time-date": { zh: "时间/日期", en: "Time/Date" },
  "shared.instance.files.editor-word-wrap": { zh: "自动换行", en: "Word wrap" },
  "shared.instance.files.editor-zoom": { zh: "缩放", en: "Zoom" },
  "shared.instance.files.editor-zoom-in": { zh: "放大", en: "Zoom in" },
  "shared.instance.files.editor-zoom-out": { zh: "缩小", en: "Zoom out" },
  "shared.instance.files.editor-zoom-reset": { zh: "还原默认缩放", en: "Restore default zoom" },
  "shared.instance.files.editor-status-bar": { zh: "状态栏", en: "Status bar" },
  "shared.instance.files.editor-loading-monaco": {
    zh: "正在加载编辑器…",
    en: "Loading editor…",
    ja: "エディターを読み込み中…",
    ru: "Загрузка редактора…",
  },
  "shared.instance.files.editor-minimap": {
    zh: "缩略图",
    en: "Minimap",
    ja: "ミニマップ",
    ru: "Мини-карта",
  },
  "shared.instance.files.editor-line-numbers": { zh: "显示行号", en: "Show line numbers" },
  "shared.instance.files.editor-cursor": { zh: "行 {line}, 列 {col}", en: "Ln {line}, Col {col}" },
  "shared.instance.files.delete-multi": { zh: "{count} 个项目", en: "{count} items" },
  "shared.instance.files.download-multi-done": { zh: "已下载 {count} 个文件", en: "Downloaded {count} files" },
  "shared.instance.events.rulesets": { zh: "规则集", en: "Rulesets" },
  "shared.instance.events.add-ruleset": { zh: "添加规则集", en: "Add ruleset" },
  "shared.instance.events.condition.any": { zh: "任一", en: "Any" },
  "shared.instance.events.condition.all": { zh: "全部", en: "All" },
  "shared.instance.events.trigger.console-output": {
    zh: "控制台输出",
    en: "Console output",
  },
  "shared.instance.events.action.send-notification": {
    zh: "发送通知",
    en: "Send notification",
  },
  "shared.instance.events.trigger.schedule": { zh: "定时", en: "Schedule" },
  "shared.instance.events.trigger.instance-status": {
    zh: "实例状态",
    en: "Instance status",
  },
  "shared.instance.events.ruleset.always-true": {
    zh: "始终为真",
    en: "Always true",
  },
  "shared.instance.events.ruleset.always-false": {
    zh: "始终为假",
    en: "Always false",
  },
  "shared.instance.events.ruleset.instance-status": {
    zh: "实例状态",
    en: "Instance status",
  },
  "shared.instance.events.mode.sequential": {
    zh: "顺序",
    en: "Sequential",
  },
  "shared.instance.events.mode.parallel": {
    zh: "并行",
    en: "Parallel",
  },
  "shared.instance.events.action.send-command": {
    zh: "发送命令",
    en: "Send command",
  },
  "shared.instance.events.action.change-status": {
    zh: "变更实例状态",
    en: "Change instance status",
  },
  "shared.instance.events.status.running": { zh: "运行中", en: "Running" },
  "shared.instance.events.status.stopped": { zh: "已停止", en: "Stopped" },
  "shared.instance.events.status.crashed": { zh: "已崩溃", en: "Crashed" },
  "shared.instance.events.action.start": { zh: "启动", en: "Start" },
  "shared.instance.events.action.stop": { zh: "关闭", en: "Stop" },
  "shared.instance.events.action.restart": { zh: "重启", en: "Restart" },
  "shared.instance.events.action.kill": { zh: "强制关闭", en: "Kill" },
  "shared.instance.settings.scan-java": { zh: "扫描 Java", en: "Scan Java" },
  "shared.instance.settings.java-scan-failed": { zh: "扫描 Java 失败", en: "Failed to scan Java runtimes" },
  "shared.instance.settings.java-count": { zh: "已找到 {count} 个 Java 运行时", en: "Found {count} Java runtime(s)" },
  "shared.instance.settings.java-empty": { zh: "未扫描到 Java，请点击扫描或手动填写路径", en: "No Java found. Scan again or enter a path manually." },
  "shared.instance.settings.jvm-helper": { zh: "JVM 助手", en: "JVM helper" },
  "shared.instance.settings.core-replace": { zh: "替换核心", en: "Replace core" },
  "shared.instance.settings.core-pick": { zh: "选择 JAR", en: "Choose JAR" },
  "shared.instance.settings.core-none": { zh: "未选择新核心", en: "No replacement core selected" },
  "shared.instance.settings.core-replace-desc": { zh: "保存时会先上传到守护进程再替换实例核心。", en: "On save the JAR is uploaded then applied as the instance core." },
  "shared.instance.settings.name-required": { zh: "实例名称不能为空", en: "Instance name is required" },
  "ui.common.clear": { zh: "清除", en: "Clear" },
  "shared.instance.files.download": { zh: "下载", en: "Download" },
  "shared.instance.files.mkdir": { zh: "新建文件夹", en: "New folder" },
  "shared.instance.files.rename": { zh: "重命名", en: "Rename" },
  "shared.instance.files.upload": { zh: "上传", en: "Upload" },
  "shared.instance.files.download-failed": {
    zh: "从守护进程下载文件失败。",
    en: "Failed to download file from daemon.",
  },
  "shared.instance.board.performance": {
    zh: "性能",
    en: "Performance",
  },
  "shared.instance.board.connection": {
    zh: "连接",
    en: "Connection",
  },
  "shared.instance.board.latency": {
    zh: "延迟",
    en: "Latency",
  },
  "shared.instance.board.address": {
    zh: "地址",
    en: "Address",
  },
  "shared.instance.board.address-empty": {
    zh: "暂无 server.properties 中的端口信息。",
    en: "No server-port found in server.properties yet.",
  },
  "shared.instance.board.hide-ip": {
    zh: "隐藏 IP",
    en: "Hide IP",
  },
  "shared.instance.board.show-ip": {
    zh: "显示 IP",
    en: "Show IP",
  },
  "shared.instance.board.players": {
    zh: "在线玩家",
    en: "Players",
  },
  "shared.instance.board.players-empty": {
    zh: "当前没有在线玩家。",
    en: "No players online.",
  },
  "shared.instance.files.go": { zh: "转到", en: "Go" },
  "shared.instance.files.size": { zh: "大小", en: "Size" },
  "shared.instance.files.modified": { zh: "修改时间", en: "Modified" },
  "shared.instance.files.mkdir-prompt": {
    zh: "新建文件夹名称",
    en: "New folder name",
  },
  "shared.instance.files.rename-prompt": {
    zh: "重命名为",
    en: "Rename to",
  },
  "shared.instance.files.delete-confirm": {
    zh: "确定删除「{name}」吗？此操作不可撤销。",
    en: "Delete “{name}”? This cannot be undone.",
  },
  "shared.instance.files.op-failed": {
    zh: "文件操作失败。",
    en: "File operation failed.",
  },
  "shared.instance.events.readonly-tip": {
    zh: "当前以只读方式展示事件规则 JSON；完整规则编辑器将后续对齐 WPF。",
    en: "Event rules are shown as read-only JSON; a full editor will match WPF later.",
  },
  "shared.instance.components.enabled": { zh: "已启用", en: "Enabled" },
  "shared.instance.components.disabled": { zh: "已禁用", en: "Disabled" },
  "shared.instance.settings.save-failed": {
    zh: "保存实例设置失败。",
    en: "Failed to save instance settings.",
  },
  "shared.instance.settings.console-mode": {
    zh: "终端模式",
    en: "Console mode",
  },
  "shared.instance.settings.console-mode-pipe": {
    zh: "管道（命令行）",
    en: "Pipe (command line)",
  },
  "shared.instance.settings.console-mode-pty": {
    zh: "PTY（交互式终端）",
    en: "PTY (interactive terminal)",
  },
  "shared.instance.settings.console-mode-hint": {
    zh: "切换后需停止并重新启动实例才会生效。PTY 适合交互式程序；Minecraft 服务端通常使用管道模式。",
    en: "Stop and restart the instance for changes to take effect. PTY suits interactive programs; Minecraft servers usually use pipe mode.",
  },
  "shared.instance.detail.overview": { zh: "实例看板", en: "Board" },
  "shared.instance.detail.console": { zh: "实时终端", en: "Console" },
  "shared.instance.detail.files": { zh: "文件管理", en: "Files",
    ja: "ファイル管理",
    ru: "文件管理" },
  "shared.instance.detail.automation": { zh: "触发事件", en: "Events System",
    ja: "イベントトリガー",
    ru: "触发事件" },
  "shared.instance.detail.components": { zh: "组件管理", en: "Components",
    ja: "コンポーネント管理",
    ru: "组件管理" },
  "shared.instance.detail.settings": { zh: "实例设置", en: "Instance Settings",
    ja: "インスタンス設定",
    ru: "Настройки экземпляра" },
  "shared.instance.detail.placeholder": {
    zh: "此二级页结构已对齐 WPF 控制台，完整能力将在后续接入。",
    en: "Secondary layout matches the WPF console; full features will arrive later.",
  },
  "shared.instance.action.start": { zh: "启动", en: "Start" },
  "shared.instance.action.stop": { zh: "关闭", en: "Stop" },
  "shared.instance.action.restart": { zh: "重启", en: "Restart" },
  "shared.instance.action.kill": { zh: "强制关闭", en: "Force Close" },
  "shared.instance.status.running": { zh: "运行中", en: "Running" },
  "shared.instance.status.stopped": { zh: "已停止", en: "Stopped" },
  "shared.instance.status.crashed": { zh: "已崩溃", en: "Crashed" },
  "shared.instances.tip": {
    zh: "纵览全局，以观天下。",
    en: "Panoramic view, all within your rule.",
    ja: "全体を見渡し、世界を観る。",
    ru: "Взгляните на общую картину, чтобы увидеть мир.",
  },
  "shared.instances.status.all": { zh: "所有状态", en: "All Statuses" },
  "shared.instances.interval.minute": { zh: "1 分钟", en: "1 minute" },
  "shared.instances.type-label": { zh: "实例类型：", en: "Instance type:" },
  "shared.instances.version-label": { zh: "版本：", en: "Version:" },
  "shared.instances.disabled.title": {
    zh: "功能已禁用",
    en: "Function disabled",
    ja: "すべての状態",
    ru: "Все статусы",
  },
  "shared.instances.disabled.description": {
    zh: "由于没有链接任何远程主机，此功能已被禁用",
    en: "This function is disabled because no remote host is connected.",
    ja: "リモートホストが接続されていないため、この機能は無効になっています",
    ru: "Эта функция отключена, так как не подключен ни один удаленный хост",
  },
  "shared.instances.connect-daemon": {
    zh: "连接远程主机",
    en: "Connect to Remote Host",
    ja: "リモートホストを接続する",
    ru: "Подключение удаленного хоста",
  },
  "shared.instances.empty.title": {
    zh: "这里空空如也",
    en: "Nothing here yet",
  },
  "shared.instances.empty.description": {
    zh: "试着往这里面放点东西",
    en: "Try to add something interesting here.",
    ja: "ここに何か追加してみてください",
    ru: "Попробуйте добавить что-нибудь сюда",
  },
  "shared.instances.confirm.start": {
    zh: "启动实例",
    en: "Start Instance",
    ja: "インスタンスを起動",
    ru: "Запустить экземпляр",
  },
  "shared.instances.confirm.stop": {
    zh: "停止实例",
    en: "Stop Instance",
    ja: "停止の確認",
    ru: "Подтверждение остановки",
  },
  "shared.instances.confirm.restart": {
    zh: "重启实例",
    en: "Restart Instance",
    ja: "再起動の確認",
    ru: "Подтверждение перезапуска",
  },
  "shared.instances.confirm.kill": {
    zh: "强制关闭实例",
    en: "Force Close Instance",
    ja: "インスタンスを強制的に閉じる",
    ru: "Принудительно закрыть экземпляр",
  },
  "shared.instances.confirm.remove": {
    zh: "删除实例",
    en: "Delete Instance",
    ja: "削除の確認",
    ru: "Подтверждение удаления",
  },
  "shared.instances.action.failed": {
    zh: "实例操作失败",
    en: "Instance operation failed",
  },
  "shared.resource-center.wpf-tip": {
    zh: "你想要的，这里都有。（当前正在使用 {provider} 下载源）",
    en: "Everything you need. (Using {provider})",
  },
  "shared.resource-center.wpf-title": {
    zh: "资源下载",
    en: "Resource Download",
  },
  "shared.resource-center.cores": { zh: "服务器核心", en: "Server cores" },
  "shared.resource-center.minecraft-version": {
    zh: "Minecraft 版本",
    en: "Minecraft version",
  },
  "shared.resource-center.build-version": {
    zh: "构建版本",
    en: "Build version",
  },
  "shared.resource-center.open-homepage": {
    zh: "打开官网",
    en: "Open homepage",
  },
  "shared.resource-center.download": { zh: "下载", en: "Download" },
  "shared.resource-center.no-files": {
    zh: "暂无可用文件",
    en: "No files available",
  },
  "shared.resource-center.provider.error": {
    zh: "下载源加载失败",
    en: "Failed to load provider",
  },
  "shared.resource-center.provider.fastmirror": {
    zh: "无极镜像",
    en: "FastMirror",
  },
  "shared.resource-center.provider.polars": {
    zh: "极星云镜像",
    en: "Polars Mirror",
  },
  "shared.resource-center.provider.rainyun": {
    zh: "雨云镜像站",
    en: "RainYun Mirror",
  },
  "shared.resource-center.provider.mslapi": {
    zh: "MSL",
    en: "MSL",
  },
  "shared.resource-center.provider.mcslsync": {
    zh: "MCSL-Sync 同步镜像",
    en: "MCSL-Sync",
  },
  "shared.settings.download.source.label": { zh: "下载源", en: "Download source" },
  "shared.settings.download.source.desc": {
    zh: "选择资源下载页面使用的镜像提供商。",
    en: "Choose the mirror provider used by Resource Download.",
  },
  "shared.settings.download.threads.label": {
    zh: "下载线程数",
    en: "Download threads",
  },
  "shared.settings.download.threads.desc": {
    zh: "并行下载线程数，范围 1 至 256。",
    en: "Parallel download threads, from 1 to 256.",
  },
  "shared.settings.download.failure.label": {
    zh: "下载失败处理",
    en: "On download failure",
  },
  "shared.settings.download.failure.desc": {
    zh: "设置下载失败后的处理方式。",
    en: "Choose what happens after a failed download.",
  },
  "shared.settings.download.failure.stop": { zh: "停止", en: "Stop" },
  "shared.settings.download.failure.retry1": {
    zh: "重试 1 次",
    en: "Retry once",
  },
  "shared.settings.download.failure.retry3": {
    zh: "重试 3 次",
    en: "Retry 3 times",
  },
  "shared.nodes.refresh-interval": { zh: "刷新间隔", en: "Interval" },
  "shared.home.announcement.title": { zh: "公告", en: "Announcement" },
  "shared.home.announcement.body": {
    zh: "MCServerLauncher Future 是 MCSL 开发组全新的项目。Web 控制台与 WPF 客户端共用 Daemon 协议，可在浏览器中管理远程主机与实例。",
    en: "MCServerLauncher Future is a new MCSL project. This web console shares the Daemon protocol with the WPF client.",
  },

  "ui.form.invalid.require": {
    zh: "此项为必填。",
    en: "This field is required.",
  },
  "ui.form.invalid.format": {
    zh: "格式不正确。",
    en: "Invalid format.",
  },
  "web.api.error.login-failed": { zh: "用户名或密码不正确。", en: "Incorrect username or password." },
  "web.api.error.admin-exists": { zh: "已存在管理员账户，请直接登录。", en: "An admin account already exists. Please sign in." },
  "web.api.error.username-exists": { zh: "该用户名已被使用。", en: "This username is already taken." },
  "web.api.error.user-not-found": { zh: "找不到该用户。", en: "User not found." },
  "web.api.error.invalid-token": { zh: "登录已失效，请重新登录。", en: "Session expired. Please sign in again." },
  "web.api.error.permission-denied": { zh: "没有权限执行此操作。", en: "You do not have permission for this action." },
  "web.api.error.internal-server-error": { zh: "服务器繁忙，请稍后重试。", en: "Server is busy. Please try again later." },
  "web.api.error.network-error": { zh: "无法连接服务器，请检查网络或确认面板服务已启动。", en: "Cannot reach the server. Check the network or panel service." },
  "web.api.error.invalid-password": { zh: "密码不符合要求。", en: "Password does not meet requirements." },
  "web.api.error.wrong-password": { zh: "原密码不正确。", en: "Current password is incorrect." },
  "web.api.error.fallback": { zh: "操作失败，请稍后重试。", en: "Operation failed. Please try again later." },
  "web.api.error.with-code": { zh: "操作失败（{code}）", en: "Operation failed ({code})" },
  "web.auth.login-failed": { zh: "登录失败", en: "Sign-in failed" },
  "web.auth.register-failed": { zh: "注册失败", en: "Registration failed" },
  "shared.create.validation.name.empty": { zh: "实例名称不能为空", en: "Instance name is required" },
  "shared.create.validation.name.dot": { zh: "实例名称不能为 . 或 ..", en: "Instance name cannot be . or .." },
  "shared.create.validation.name.invalid": { zh: "实例名称包含非法字符", en: "Instance name contains invalid characters" },
  "shared.create.validation.java.empty": { zh: "请选择或填写 Java 路径", en: "Select or enter a Java path" },
  "shared.create.validation.java.display": { zh: "请选择具体的 Java 可执行文件路径", en: "Select a concrete Java executable path" },
  "shared.create.validation.jar.empty": { zh: "请选择服务器核心 jar 文件", en: "Select a server core jar file" },
  "shared.create.validation.jar.ext": { zh: "核心文件必须是 .jar", en: "Core file must be a .jar" },
  "shared.create.validation.loader": { zh: "请选择 Minecraft 版本与 Loader 版本", en: "Select Minecraft and loader versions" },
  "shared.daemon.error.disconnected": { zh: "无法连接到远程主机", en: "Failed to connect to daemon" },
  "shared.daemon.error.node-missing": { zh: "远程主机不存在", en: "Remote host not found" },
  "shared.daemon.error.token-missing": { zh: "缺少访问令牌", en: "Access token is missing" },
  "shared.daemon.error.system-info": { zh: "无法连接到远程主机", en: "Failed to connect to daemon" },
  "shared.daemon.error.connect-failed": { zh: "无法连接到远程主机", en: "Failed to connect to daemon",
    ja: "デーモンへの接続に失敗しました",
    ru: "Не удалось подключиться к демону" },
  "shared.daemon.error.refresh-failed": { zh: "刷新失败", en: "Refresh failed" },
  "shared.daemon.error.not-connected": { zh: "远程主机未连接", en: "Remote host is not connected" },
  "shared.daemon.error.operation-failed": { zh: "操作失败", en: "Operation failed" },
  "shared.daemon.error.ws-failed": { zh: "WebSocket 连接失败", en: "WebSocket connection failed" },
  "shared.daemon.error.ws-closed": { zh: "WebSocket 连接关闭", en: "WebSocket connection closed" },
  "shared.daemon.error.request-timeout": { zh: "请求超时：{action}", en: "Request timed out: {action}" },
  "shared.daemon.error.action-failed": { zh: "Action 失败：{action}", en: "Action failed: {action}" },
  "shared.daemon.error.create-no-config": { zh: "创建实例成功但未返回配置", en: "Instance created but no config returned" },
  "shared.daemon.error.upload-session": { zh: "文件上传会话创建失败", en: "Failed to create upload session" },
  "shared.daemon.error.upload-cancelled": { zh: "上传已取消", en: "Upload cancelled" },
  "shared.daemon.error.upload-chunk-timeout": { zh: "文件分片上传超时", en: "Upload chunk timed out" },
  "shared.daemon.error.read-logs-failed": { zh: "读取日志失败", en: "Failed to read logs" },
  "shared.daemon.error.code.instance.not_running": {
    zh: "实例未在运行（可能已关闭）",
    en: "Instance is not running (already stopped)",
  },
  "shared.daemon.error.code.instance.already_running": {
    zh: "实例已在运行",
    en: "Instance is already running",
  },
  "shared.daemon.error.code.instance.running": {
    zh: "实例仍在运行，请先关闭",
    en: "Instance is still running; stop it first",
  },
  "shared.daemon.error.code.instance.not_found": {
    zh: "找不到该实例",
    en: "Instance not found",
  },
  "shared.daemon.error.code.instance.start_failed": {
    zh: "启动实例失败",
    en: "Failed to start instance",
  },
  "shared.daemon.error.code.instance.stop_failed": {
    zh: "关闭实例失败",
    en: "Failed to stop instance",
  },
  "shared.download.cancelled": { zh: "下载已取消", en: "Download cancelled" },
  "shared.resource-center.tag.proxy": { zh: "代理", en: "Proxy",
    ja: "ダウンロードキャンセル",
    ru: "下载已取消" },
  "shared.resource-center.tag.vanilla": { zh: "原版", en: "Vanilla",
    ja: "バニラ",
    ru: "Исходный текст" },
  "shared.resource-center.tag.pure": { zh: "纯净", en: "Purity",
    ja: "ピュア",
    ru: "чистый" },
  "shared.resource-center.tag.mod": { zh: "模组", en: "Mods",
    ja: "モッド",
    ru: "Модуль" },
  "shared.resource-center.tag.bedrock": { zh: "基岩", en: "Bedrock",
    ja: "統合版",
    ru: "коренная порода" },
  "shared.brand.platform.tauri": { zh: "Tauri (跨平台)", en: "Tauri (cross-platform)" },
  "shared.brand.platform.web": { zh: "Web (浏览器)", en: "Web (browser)" },
  "shared.tauri.save-dialog.title": { zh: "保存下载文件", en: "Save download" },
  "shared.locale.en-US": { zh: "English", en: "English" },
  "shared.locale.ja-JP": { zh: "日本語", en: "Japanese" },
  "shared.locale.ru-RU": { zh: "Русский", en: "Russian" },
  "shared.locale.zh-CN": { zh: "简体中文", en: "Simplified Chinese" },
  "shared.locale.zh-TW": { zh: "繁體中文（台灣）", en: "Traditional Chinese (Taiwan)" },
  "shared.locale.zh-HK": { zh: "繁體中文（香港）", en: "Traditional Chinese (Hong Kong)" },
  "shared.locale.zh-MEME": { zh: "梗体中文", en: "Meme Chinese" },
};


export function createTranslator(locale: LocaleCode) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
}

export function detectSystemLocale(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages
    : ["zh-CN"],
): LocaleCode {
  for (const lang of languages) {
    const normalized = lang.replace("_", "-");
    if (normalized in MESSAGE_CATALOG) return normalized as LocaleCode;
    const base = normalized.toLowerCase();
    if (base.startsWith("zh-hant") || base === "zh-tw") return "zh-TW";
    if (base.startsWith("zh-hk")) return "zh-HK";
    if (base.startsWith("zh")) return "zh-CN";
    if (base.startsWith("ja")) return "ja-JP";
    if (base.startsWith("ru")) return "ru-RU";
    if (base.startsWith("en")) return "en-US";
  }
  return "zh-CN";
}


/** 非 React 代码读取当前界面语言（localStorage preference → system → zh-CN） */
export function resolveActiveLocale(): LocaleCode {
  if (typeof window === "undefined") return "zh-CN";
  const pref = readLocalePreference();
  return pref === "system" ? detectSystemLocale() : pref;
}

/** 非 React 场景翻译（错误消息、Daemon 客户端、下载管理器等） */
export function tKey(
  key: string,
  params?: Record<string, string | number>,
): string {
  return translate(resolveActiveLocale(), key, params);
}
