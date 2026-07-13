import { MESSAGE_CATALOG } from "@/lib/i18n/messages";
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
  "ui.form.invalid": {
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
  "shared.dashboard.subtitle": {
    zh: "在这里查看账户状态，并快速前往节点与实例管理。",
    en: "Check account status and jump to nodes or instances.",
  },
  "shared.nodes.subtitle": {
    zh: "安全护航，只在指掌。",
    en: "Secure guardianship at your fingertips.",
  },
  "shared.nodes.list.title": { zh: "节点列表", en: "Node list" },
  "shared.nodes.list.empty.title": {
    zh: "尚未添加节点",
    en: "No nodes yet",
  },
  "shared.nodes.list.empty.desc": {
    zh: "请准备一台已运行 MCSL Daemon 的服务器，并填写主机、端口与访问令牌。",
    en: "Prepare a host running MCSL Daemon, then fill in host, port and access token.",
  },
  "shared.nodes.form.add": { zh: "添加节点", en: "Add node" },
  "shared.nodes.form.edit": { zh: "编辑连接", en: "Edit connection" },
  "shared.nodes.form.desc": {
    zh: "连接信息仅保存在当前浏览器，不会上传到面板服务器。",
    en: "Connection details stay in this browser.",
  },
  "shared.nodes.status.offline": { zh: "未连接", en: "Offline" },
  "shared.nodes.status.online": { zh: "已连接", en: "Online" },
  "shared.nodes.status.connecting": { zh: "连接中", en: "Connecting" },
  "shared.nodes.status.reconnecting": {
    zh: "重连中",
    en: "Reconnecting",
  },
  "shared.nodes.connect.action": { zh: "连接", en: "Connect" },
  "shared.nodes.disconnect": { zh: "断开", en: "Disconnect" },
  "shared.nodes.connect.all": { zh: "全部连接", en: "Connect all" },
  "shared.nodes.saved": { zh: "节点已保存。", en: "Node saved." },
  "shared.nodes.disconnected": {
    zh: "已断开节点连接。",
    en: "Node disconnected.",
  },
  "shared.nodes.connect.test": { zh: "测试连接", en: "Test connection" },
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
    zh: "查看各节点上的服务器实例，进行启动、停止与进入控制台等操作。",
    en: "View instances on each node and start, stop, or open the console.",
  },
  "shared.instances.refresh": { zh: "刷新实例", en: "Refresh" },
  "shared.instances.open": { zh: "打开", en: "Open" },
  "shared.instances.summary": {
    zh: "显示 {instances} 个实例 · 节点在线 {online}/{total}",
    en: "{instances} instances · nodes online {online}/{total}",
  },
  "shared.instances.table.name": { zh: "名称", en: "Name" },
  "shared.instances.table.type": { zh: "类型", en: "Type" },
  "shared.instances.table.status": { zh: "状态", en: "Status" },
  "shared.instances.empty.no-nodes.title": {
    zh: "还没有可管理的实例",
    en: "No instances to manage",
  },
  "shared.instances.empty.no-nodes.desc": {
    zh: "实例运行在节点上。请先添加并连接 MCSL Daemon 节点，再创建服务器。",
    en: "Instances run on nodes. Add and connect an MCSL Daemon node first.",
  },
  "shared.instances.empty.no-data.title": {
    zh: "当前没有实例",
    en: "No instances yet",
  },
  "shared.instances.empty.no-data.desc": {
    zh: "已保存节点配置。连接守护进程后，已有实例会出现在此列表；也可以立即创建新实例。",
    en: "Node settings are saved. Connect the daemon to sync instances, or create a new one.",
  },
  "shared.instances.empty.not-connected": {
    zh: "节点尚未连上。请到「远程节点」连接 MCSL Daemon 后再刷新。",
    en: "No node is online. Connect MCSL Daemon under Nodes, then refresh.",
  },
  "shared.instance.detail.connected": {
    zh: "节点已连接，可操作此实例。",
    en: "Node connected. Instance controls are available.",
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
    en: "Universal Minecraft Java server",
  },
  "shared.create.type.forge": {
    zh: "Minecraft Forge 服务器",
    en: "Minecraft Forge server",
  },
  "shared.create.type.neoforge": {
    zh: "Minecraft NeoForge 服务器",
    en: "Minecraft NeoForge server",
  },
  "shared.create.type.fabric": {
    zh: "Minecraft Fabric 服务器",
    en: "Minecraft Fabric server",
  },
  "shared.create.type.quilt": {
    zh: "Minecraft Quilt 服务器",
    en: "Minecraft Quilt server",
  },
  "shared.create.type.mcbe": {
    zh: "Minecraft 基岩版服务器",
    en: "Minecraft Bedrock server",
  },
  "shared.create.type.terraria": {
    zh: "Terraria 游戏服务器",
    en: "Terraria game server",
  },
  "shared.create.type.universal": {
    zh: "其他控制台程序",
    en: "Other console application",
  },
  "shared.create.run-command.label": {
    zh: "运行命令",
    en: "Run command",
  },
  "shared.create.run-command.desc": {
    zh: "在此处输入运行命令；如需附带参数，请直接附在命令后面。",
    en: "Enter the run command and append any required arguments.",
  },
  "shared.create.need-node.title": {
    zh: "请先添加节点",
    en: "Add a node first",
  },
  "shared.create.need-node.desc": {
    zh: "实例必须创建在节点上。请先添加至少一台 MCSL Daemon 节点。",
    en: "Instances must be created on a node. Add at least one MCSL Daemon node.",
  },
  "shared.create.submit.blocked": {
    zh: "节点尚未连接成功。请到「远程节点」确认地址与令牌，并确保 MCSL Daemon 正在运行。",
    en: "The node is not connected yet. Check address and token under Nodes, and ensure MCSL Daemon is running.",
  },
  "shared.help-center.subtitle": {
    zh: "常见问题与上手指引，帮助你更快完成部署与日常运维。",
    en: "FAQs and getting-started tips for setup and day-to-day ops.",
  },
  "shared.resource-center.subtitle": {
    zh: "常用服务端核心与文档入口。下载与安装仍由你在节点上完成。",
    en: "Common server cores and docs. Downloads still happen on your node.",
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
    zh: "下载与安装仍需在节点侧完成；面板不会代替 Daemon 执行安装。",
    en: "Downloads and installs still run on the node; the panel does not replace Daemon installers.",
  },
  "shared.resource-center.history.title": {
    zh: "下载历史",
    en: "Download history",
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
    zh: "无法连接节点：检查 Daemon 是否运行、主机端口、访问令牌，以及是否使用了正确的 ws/wss。",
    en: "Cannot connect: check Daemon is running, host/port/token, and ws/wss.",
  },
  "shared.help-center.faq.create": {
    zh: "创建实例前需至少有一台已连接的远程主机；无节点时请先到「远程主机」添加连接。",
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
  "shared.settings.saved": { zh: "设置已保存。", en: "Settings saved." },
  "shared.settings.save": { zh: "保存设置", en: "Save settings" },
  "shared.preferences.root": { zh: "偏好设置", en: "Preferences" },
  "shared.preferences.language": { zh: "语言", en: "Language" },
  "shared.preferences.theme.root": { zh: "主题", en: "Theme" },

  "shared.nodes.refresh": { zh: "刷新", en: "Refresh" },
  "shared.nodes.search.placeholder": {
    zh: "搜索名称、地址、状态、系统…",
    en: "Search name, address, status, system…",
  },
  "shared.nodes.search.empty": {
    zh: "没有匹配的节点",
    en: "No matching nodes",
  },
  "shared.nodes.search.empty.desc": {
    zh: "试试其他关键词，或清空搜索。",
    en: "Try another keyword, or clear the search.",
  },
  "shared.nodes.auto-refresh": { zh: "自动刷新", en: "Auto refresh" },
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
    en: "Unable to connect. Check configuration.",
  },
  "shared.nodes.connect.retry": { zh: "重试连接", en: "Retry" },
  "shared.nodes.connect.scheme": { zh: "协议", en: "Scheme" },
  "shared.nodes.form.save": { zh: "保存", en: "Save" },
  "shared.nodes.delete.confirm": {
    zh: "确定删除「{name}」？",
    en: "Delete “{name}”?",
  },
  "shared.nodes.delete.success": {
    zh: "已删除守护进程。",
    en: "Daemon deleted.",
  },
  "shared.nodes.status.ok": { zh: "正常", en: "OK" },
  "shared.nodes.status.error": { zh: "异常", en: "Error" },
  "shared.nodes.card.uri": { zh: "远端地址:", en: "Remote address:" },
  "shared.nodes.card.status": { zh: "链接状态:", en: "Connection status:" },
  "shared.nodes.card.system": { zh: "操作系统:", en: "Operating system:" },
  "shared.nodes.card.daemon": { zh: "节点版本:", en: "Daemon version:" },
  "shared.nodes.card.view-error": { zh: "查看错误", en: "View error" },
  "shared.nodes.resource.not-loaded": { zh: "未加载", en: "Not loaded" },
  "shared.nodes.resource.load-failed": { zh: "加载失败", en: "Load failed" },
  "shared.nodes.resource.cpu": { zh: "CPU", en: "CPU" },
  "shared.nodes.resource.memory": { zh: "内存", en: "Memory" },
  "shared.nodes.resource.drive": { zh: "磁盘", en: "Disk" },
  "shared.account.subtitle": {
    zh: "查看资料、修改密码，并管理已登录的设备会话。",
    en: "View profile, change password, and manage signed-in sessions.",
  },
  "shared.instance.console.need-connection": {
    zh: "需要连接节点后才能使用此功能。请先在「远程节点」中保存并连接 MCSL Daemon。",
    en: "Connect a node to use this feature. Save and connect MCSL Daemon under Nodes first.",
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
  "web.users.create.denied": {
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
  "ui.common.cancel": { zh: "取消", en: "Cancel" },
  "ui.common.delete": { zh: "删除", en: "Delete" },
  "shared.nodes.title": { zh: "远程主机", en: "Remote hosts" },
  "shared.nodes.tip": {
    zh: "安全护航，只在指掌。",
    en: "Secure guardianship at your fingertips.",
  },
  "shared.nodes.search": { zh: "搜索", en: "Search" },
  "shared.nodes.connect.new": { zh: "新建连接", en: "New connection" },
  "shared.nodes.auto-refresh.on": {
    zh: "自动刷新: 开",
    en: "Auto refresh: On",
  },
  "shared.nodes.auto-refresh.off": {
    zh: "自动刷新: 关",
    en: "Auto refresh: Off",
  },
  "shared.nodes.connect.name.label": { zh: "备注名", en: "Friendly name" },
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
  "shared.instance.console.title": { zh: "实例控制台", en: "Instance console" },
  "shared.instance.console.placeholder": {
    zh: "输入要发送的命令…",
    en: "Enter a command…",
  },
  "shared.instance.console.send": { zh: "发送", en: "Send" },
  "shared.instance.detail.overview": { zh: "实例看板", en: "Board" },
  "shared.instance.detail.console": { zh: "实时终端", en: "Console" },
  "shared.instance.detail.files": { zh: "文件管理", en: "Files" },
  "shared.instance.detail.automation": { zh: "触发事件", en: "Events" },
  "shared.instance.detail.components": { zh: "组件管理", en: "Components" },
  "shared.instance.detail.settings": { zh: "实例设置", en: "Settings" },
  "shared.instance.detail.placeholder": {
    zh: "此二级页结构已对齐 WPF 控制台，完整能力将在后续接入。",
    en: "Secondary layout matches the WPF console; full features will arrive later.",
  },
  "shared.instance.action.start": { zh: "启动", en: "Start" },
  "shared.instance.action.stop": { zh: "关闭", en: "Stop" },
  "shared.instance.action.restart": { zh: "重启", en: "Restart" },
  "shared.instance.action.kill": { zh: "强制关闭", en: "Force kill" },
  "shared.instance.status.running": { zh: "运行中", en: "Running" },
  "shared.instance.status.stopped": { zh: "已停止", en: "Stopped" },
  "shared.instance.status.crashed": { zh: "已崩溃", en: "Crashed" },
  "shared.instances.tip": {
    zh: "纵览全局，以观天下。",
    en: "See every instance at a glance.",
  },
  "shared.instances.status.all": { zh: "所有状态", en: "All statuses" },
  "shared.instances.interval.minute": { zh: "1 分钟", en: "1 minute" },
  "shared.instances.type-label": { zh: "实例类型：", en: "Instance type:" },
  "shared.instances.version-label": { zh: "版本：", en: "Version:" },
  "shared.instances.disabled.title": {
    zh: "功能已禁用",
    en: "Feature disabled",
  },
  "shared.instances.disabled.description": {
    zh: "由于没有链接任何远程主机，此功能已被禁用",
    en: "This feature is disabled because no remote host is configured.",
  },
  "shared.instances.connect-daemon": {
    zh: "连接远程主机",
    en: "Connect remote host",
  },
  "shared.instances.empty.title": {
    zh: "这里空空如也",
    en: "Nothing here yet",
  },
  "shared.instances.empty.description": {
    zh: "试着往这里面放点东西",
    en: "Try adding something here.",
  },
  "shared.instances.confirm.start": {
    zh: "确定启动实例「{name}」？",
    en: "Start instance “{name}”?",
  },
  "shared.instances.confirm.stop": {
    zh: "确定关闭实例「{name}」？",
    en: "Stop instance “{name}”?",
  },
  "shared.instances.confirm.restart": {
    zh: "确定重启实例「{name}」？",
    en: "Restart instance “{name}”?",
  },
  "shared.instances.confirm.kill": {
    zh: "确定强制关闭实例「{name}」？这可能造成数据丢失。",
    en: "Force kill “{name}”? This may cause data loss.",
  },
  "shared.instances.confirm.remove": {
    zh: "确定删除实例「{name}」？",
    en: "Delete instance “{name}”?",
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
  "shared.settings.download.source": { zh: "下载源", en: "Download source" },
  "shared.settings.download.source.desc": {
    zh: "选择资源下载页面使用的镜像提供商。",
    en: "Choose the mirror provider used by Resource Download.",
  },
  "shared.settings.download.threads": {
    zh: "下载线程数",
    en: "Download threads",
  },
  "shared.settings.download.threads.desc": {
    zh: "并行下载线程数，范围 1 至 256。",
    en: "Parallel download threads, from 1 to 256.",
  },
  "shared.settings.download.failure": {
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
