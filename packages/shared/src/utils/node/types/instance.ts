import type { Core } from "./cores.ts";

export type Encoding = "utf-8" | "gbk"; // 标准输入输出编码

// 自动重启策略
// no - 不自动重启
// oncrash - 仅在实例崩溃（返回值非0）时自动重启
// always - 非手动停止自动重启
export type AutoRestart = "no" | "oncrash" | "always";

export type InstanceStatus =
  | "installing"
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "crashed";

export interface InstanceBasicInfo {
  id: string; // 实例 ID，由 Daemon 生成
  name: string; // 实例名称
  status: InstanceStatus; // 实例状态
}

export interface InstanceTypeInfo {
  type: Core; // 核心类型
  coreVersion: string; // 核心版本
  loaderVersion?: string; // 加载器版本（如 Fabric, TShock），无加载器时为空
}

export interface InstanceSettings {
  startCommand: string; // 启动命令
  stopCommand: string; // 停止命令
  stdinEncoding: Encoding; // 标准输入编码，默认 utf-8
  stdoutEncoding: Encoding; // 标准输出编码，默认 utf-8
  env: Record<string, string>; // 环境变量
  autoRestart: AutoRestart | boolean; // 自动重启策略，默认不自动重启
}

export function isRunning(status: InstanceStatus) {
  return status === "running" || status === "starting" || status === "stopping";
}
