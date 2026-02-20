import PERMISSIONS from "../assets/permissions.json";

export { PERMISSIONS };

export const PERMISSION_REGEX =
  /^(([a-zA-Z-_]+|\*{1,2})\.)*([a-zA-Z-_]+|\*{1,2})$/;

export function matchPermission(
  userPermission: string,
  matchingPermission: string,
): boolean {
  if (
    !PERMISSION_REGEX.test(userPermission) &&
    !PERMISSION_REGEX.test(matchingPermission)
  )
    throw new Error("Invalid permission format");

  const pattern =
    userPermission
      .replace(".", String.raw`\s`)
      .replace("**", ".+")
      .replace("*", String.raw`\S+`) + String.raw`(\s.+)`;
  const input = matchingPermission.replace(".", " ");
  const regex = new RegExp("^" + pattern + "$");
  return regex.test(input);
}
