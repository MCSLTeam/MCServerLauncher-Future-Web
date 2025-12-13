import type { ConnectionInfo } from "../types/node.ts";
import type {
  InstanceBasicInfo,
  InstanceSettings,
  InstanceStatus,
  InstanceTypeInfo,
} from "../types/instance.ts";
import type { ComputedRef } from "vue";
import type { DirectoryInfo, FileInfo, FilePath } from "../types/files.ts";

export abstract class AbstractAdapter {
  // 基本操作
  abstract get info(): ConnectionInfo;

  // 实例操作
  private readonly instanceIcons: Map<string, Uint8Array> = new Map();

  async getInstances(): Promise<InstanceBasicInfo[]> {
    const instances = await this.absGetInstances();
    for (const key of this.instanceIcons.keys()) {
      if (!instances.some((instance) => instance.id === key))
        this.instanceIcons.delete(key);
    }
    return instances;
  }
  abstract absGetInstances(): Promise<InstanceBasicInfo[]>;

  async getInstanceIcon(id: string): Promise<Uint8Array> {
    if (this.instanceIcons.has(id)) return this.instanceIcons.get(id)!;
    const icon = await this.absGetInstanceIcon(id);
    this.instanceIcons.set(id, icon);
    return icon;
  }
  abstract absGetInstanceIcon(id: string): Promise<Uint8Array>;

  async setInstanceIcon(id: string, icon?: Uint8Array) {
    await this.absSetInstanceIcon(id, icon);
    this.instanceIcons.delete(id);
    await this.absSetInstanceIcon(id, icon);
  }
  abstract absSetInstanceIcon(id: string, icon?: Uint8Array): Promise<void>;

  abstract getInstanceTypeInfo(
    id: string,
  ): Promise<InstanceTypeInfo | undefined>;

  abstract changeInstanceType(
    id: string,
    typeInfo: InstanceTypeInfo,
  ): Promise<void>;

  abstract getInstanceSettings(id: string): Promise<Partial<InstanceSettings>>;

  abstract changeInstanceSettings(
    id: string,
    settings: Partial<InstanceSettings>,
  ): Promise<void>;

  abstract getInstanceStatus(id: string): Promise<InstanceStatus>;

  abstract startInstance(id: string): Promise<void>;

  abstract stopInstance(id: string): Promise<void>;

  abstract killInstance(id: string): Promise<void>;

  abstract restartInstance(id: string): Promise<void>;

  abstract executeCommand(id: string, command: string): Promise<void>;

  abstract getInstanceLogs(id: string): Promise<ComputedRef<string>>;

  abstract createInstance(
    info: InstanceBasicInfo,
    type: InstanceTypeInfo | undefined,
    settings: Partial<InstanceSettings>,
    icon: Uint8Array | undefined,
  ): Promise<void>;

  // 文件操作
  abstract listFiles(path: FilePath): Promise<(FileInfo | DirectoryInfo)[]>;

  abstract readFile(path: FilePath): Promise<Uint8Array>;

  abstract writeFile(path: FilePath, data: Uint8Array): Promise<void>;

  abstract deleteFile(path: FilePath): Promise<void>;

  abstract renameFile(path: FilePath, newPath: FilePath): Promise<void>;

  abstract createDirectory(path: FilePath): Promise<void>;

  abstract createSymbolicLink(target: FilePath, link: FilePath): Promise<void>;

  abstract createFile(path: FilePath): Promise<void>;

  abstract moveFile(path: FilePath, newPath: FilePath): Promise<void>;

  abstract copyFile(path: FilePath, newPath: FilePath): Promise<void>;

  abstract changeFilePermission(
    path: FilePath,
    permission: string,
  ): Promise<void>;

  abstract compressFile(
    files: FilePath[],
    newPath: FilePath,
    type: "zip" | "tar.gz",
  ): Promise<void>;

  abstract extractFile(
    path: FilePath,
    newPath: FilePath,
    replace: boolean,
  ): Promise<void>;
}
