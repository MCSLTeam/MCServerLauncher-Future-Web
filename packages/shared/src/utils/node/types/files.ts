export type FileType = "file" | "directory";

export type FilePath = {
  node: string; // 节点 ID
  path: string; // 节点下的相对路径
};

interface BaseInfo {
  name: string;
  path: FilePath;
  type: FileType;
  created: string; // 时间均为ISO-8601
  modified: string;
}

export interface FileInfo extends BaseInfo {
  type: "file";
  size: bigint;
  permission: string;
  readonly?: boolean;
}

export interface DirectoryInfo extends BaseInfo {
  type: "directory";
  hidden?: boolean;
  link?: string; // 符号链接目标路径
}
