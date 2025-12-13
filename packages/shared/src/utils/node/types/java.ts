export type JavaType = "jdk" | "jre";

export interface Java {
  type: JavaType; // Java 类型
  version: string; // Java 版本
  vendor: string; // Java 供应商
}

export interface JavaRuntimeInfo extends Java {
  path: string; // Java 路径
}
