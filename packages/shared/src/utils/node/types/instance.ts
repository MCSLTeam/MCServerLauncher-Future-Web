import type { Core } from "./cores.ts";

export type Encoding = "utf-8" | "gbk"; // 标准输入输出编码

export type Mirror = "vanilla" | "bmclapi"; // 镜像地址

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
  id: string; // 实例 ID，也是实例目录名
  name: string; // 实例名称
}

export interface InstanceTypeInfo {
  type: Core; // 核心类型
  coreVersion: string; // 核心版本
  loaderVersion?: string; // 加载器版本（如 Fabric, TShock），无加载器时为空
  mirror?: Mirror; // 镜像地址，无镜像时为空
}

export interface InstanceConfig {
  startCommand: string; // 启动命令
  stopCommand: string; // 停止命令
  stdinEncoding: Encoding; // 标准输入编码，默认 utf-8
  stdoutEncoding: Encoding; // 标准输出编码，默认 utf-8
  env: Record<string, string>; // 环境变量
  autoRestart: AutoRestart | boolean; // 自动重启策略，默认不自动重启
}

export interface InstanceStatusInfo {
  status: InstanceStatus; // 实例状态
  diskUsage: bigint; // 磁盘占用率，单位为字节
  pid?: number; // 进程 ID
  cpuUsage?: number; // CPU 占用率，0-100 之间的整数
  memoryUsage?: bigint; // 内存占用率，单位为字节
}

export function isRunning(status: InstanceStatus) {
  return status === "running" || status === "starting" || status === "stopping";
}
