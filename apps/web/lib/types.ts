export type UserInfo = {
  username: string;
  permissions: string[];
  created_at: number;
};

export type SessionInfo = {
  user: string;
  token_id: string;
  remember: boolean;
  user_agent: string;
  last_active_ip: string;
  last_active_at: number;
  created_at: number;
};

export type NodeType = "mcsl-daemon";
export type NodeStatus = "online" | "offline" | "connecting" | "reconnecting";

/** 节点可见性：全局共享，管理员配置谁能看见 */
export type NodeVisibilityMode = "all" | "selected" | "admins";

/** 共享守护进程节点（后端持久化；浏览器仅缓存连接态） */
export type SavedNode = {
  id: string;
  name: string;
  type: NodeType;
  host: string;
  port: string;
  secure: boolean;
  /** 连接令牌，列表中不展示明文 */
  hasToken: boolean;
  /** 可见性（管理员可配置） */
  visibility?: NodeVisibilityMode;
  /** visibility=selected 时的可见用户名 */
  visibleTo?: string[];
  createdAt: number;
  updatedAt: number;
};

export type InstanceStatus =
  | "installing"
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "crashed";

export type InstanceListItem = {
  id: string;
  nodeId: string;
  nodeName: string;
  name: string;
  status: InstanceStatus;
  type: string;
  gameVersion?: string;
  loaderVersion?: string;
  updatedAt?: number;
};

export type CreateMethod = "core" | "script" | "pack";
