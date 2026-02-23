import type { InstanceStatus } from "./node/types/instance.ts";
import { type MenuItem } from "@repo/ui/src/components/panel/Menu.vue";
import { useLocale } from "@repo/ui/src/utils/stores.ts";

export function snakeToPascal(snakeStr: string) {
  if (snakeStr == "me_frp") return "MEFrp"; // 特殊处理awa
  return snakeStr
    .split("_")
    .filter((word) => word.length > 0)
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export function getStatusColor(status: InstanceStatus) {
  switch (status) {
    case "running":
      return "green";
    case "stopped":
      return "gray";
    case "starting":
      return "teal";
    case "stopping":
      return "orange";
    case "crashed":
      return "red";
    case "installing":
      return "blue";
  }
}

export function buildActionContextmenu(instance: any) {
  const t = useLocale().getI18n().t;
  const menuInfo: MenuItem[] = [];
  switch (instance.status) {
    case "stopped":
    case "crashed":
      menuInfo.push({
        color: "emerald",
        icon: "fa fa-play",
        label: t("shared.instance.action.start"),
        onClick: () => {},
      });
      break;
    case "starting":
    case "running":
      menuInfo.push(
        {
          color: "orange",
          icon: "fa fa-rotate-right",
          label: t("shared.instance.action.restart"),
          onClick: () => {},
        },
        {
          color: "rose",
          icon: "fa fa-stop",
          label: t("shared.instance.action.stop"),
          onClick: () => {},
        },
      );
    // eslint-disable-next-line no-fallthrough
    case "stopping":
      menuInfo.push({
        color: "red",
        icon: "fa fa-power-off",
        label: t("shared.instance.action.kill"),
        onClick: () => {},
      });
      break;
  }
  return menuInfo;
}
