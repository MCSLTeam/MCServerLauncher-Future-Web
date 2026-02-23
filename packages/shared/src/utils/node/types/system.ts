export type JavaType = "jdk" | "jre";

export interface JavaInfo {
  path: string;
  type: JavaType;
  version: string;
  vendor: string;
  arch: string;
}

export interface SystemInfo {
  os: {
    name: string; // 操作系统名称
    version: string; // 操作系统版本
    arch: string; // 操作系统架构
    isDocker: boolean; // 是否为 Docker 环境
  };
  cpu: {
    name: string; // CPU 型号
    vendor: string; // CPU 供应商，例如 `intel`、`amd` 等
    count: number; // CPU 线程数
    usage: number; // 用户进程 CPU 占用率，0 - 1
  };
  memory: {
    free: bigint; // 可用内存，单位为KB
    total: bigint; // 总内存，单位为KB
  };
  disk: {
    drive_format: string; // 磁盘格式
    free: bigint; // 可用磁盘空间，单位为字节
    total: bigint; // 总磁盘空间，单位为字节
  };
}
