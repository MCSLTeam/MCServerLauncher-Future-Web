/**
 * 与后端 apps/web/src/utils.rs::permission_match 对齐：
 * - `.` 为段分隔
 * - `*` 匹配单段
 * - `**` 匹配多段
 * - 用户权限可隐式覆盖其后的子路径
 */
export function permissionMatch(
  userPermission: string,
  matchingPermission: string,
): boolean {
  let pattern = userPermission
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".+")
    .replace(/\*/g, '[^"]+');
  pattern += "(\\..+)?";
  try {
    return new RegExp(`^${pattern}$`).test(matchingPermission);
  } catch {
    return false;
  }
}

export function hasPermission(
  permissions: string[] | undefined | null,
  required: string,
): boolean {
  if (!permissions?.length) return false;
  return permissions.some((p) => permissionMatch(p, required));
}

export function canCreateUsers(permissions: string[] | undefined | null) {
  return hasPermission(permissions, "mcsl.web.user.create");
}

export function canDeleteUser(
  permissions: string[] | undefined | null,
  username: string,
) {
  return hasPermission(permissions, `mcsl.web.user.${username}.delete`);
}

export function canChangeUserInfo(
  permissions: string[] | undefined | null,
  username: string,
) {
  return hasPermission(permissions, `mcsl.web.user.${username}.info.change`);
}

/** 管理共享节点与可见性（admin `*` 或 mcsl.web.node.manage） */
export function canManageNodes(permissions: string[] | undefined | null) {
  return hasPermission(permissions, "mcsl.web.node.manage");
}

/** 新建用户时的权限预设（给最终用户看的选项，不是内部代号） */
export const PERMISSION_PRESETS = [
  {
    id: "admin",
    labelKey: "web.users.preset.admin",
    permissions: ["*"],
  },
  {
    id: "operator",
    labelKey: "web.users.preset.operator",
    // 可创建用户、读写会话与用户信息（通配用户名）
    permissions: [
      "mcsl.web.user.create",
      "mcsl.web.user.*.info.read",
      "mcsl.web.user.*.info.change",
      "mcsl.web.user.*.session.read",
      "mcsl.web.user.*.session.delete",
    ],
  },
  {
    id: "viewer",
    labelKey: "web.users.preset.viewer",
    permissions: ["mcsl.web.user.*.info.read", "mcsl.web.user.*.session.read"],
  },
] as const;
