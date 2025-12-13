export type NodeType = "mcsl-daemon"; // | "mcsm" | "vanilla-ws" | "vanilla-rcon";

export type NodeStatus = "online" | "offline" | "connecting" | "reconnecting";

export interface ConnectionInfo {
  id: string; // 节点 ID，由 web 生成
  type: NodeType; // 节点类型
  host: string; // 节点主机名
  port: string; // 节点端口号
  secure?: boolean; // 安全连接（https / wss），协议不支持则为空
  token?: string; // 安全起见不主动展示，字段仅用于添加 / 修改
}
