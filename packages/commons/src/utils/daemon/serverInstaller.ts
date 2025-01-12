import axios from "axios";
import { ElNotification } from "element-plus";
import { useLocale } from "../uses";

export enum ServerInstallType {
  Download,
  ImportCore,
  ImportPack,
}

export async function getMcVersions() {
  return new Promise((resolve, reject) => {
    axios("https://piston-meta.mojang.com/mc/game/version_manifest.json")
      .then((res) => {
        resolve(res.data);
      })
      .catch(() => {
        reject();
      });
  });
}

// TODO: 调用daemon获取版本列表，先用这个顶着
export async function getTypeVersions(type: string, mcVersion: string) {
  switch (type) {
    case "fabric":
      return (() => {
        const fabricVersions: string[] = [];
        axios("https://meta.fabricmc.net/v2/versions/loader")
          .then((res) => {
            for (const version of res.data) {
              fabricVersions.push(version.version);
            }
          })
          .catch(() => {
            ElNotification({
              title: useLocale().getComposer().t("notification.warning.title"),
              message: "无法加载Fabric版本清单",
              type: "warning",
            });
          });
        return fabricVersions;
      })();
    case "forge":
      break;
    case "quilt":
      return (() => {
        const quiltVersions: string[] = [];
        axios("https://meta.quiltmc.org/v3/versions/loader")
          .then((res) => {
            for (const version of res.data) {
              quiltVersions.push(version.version);
            }
          })
          .catch(() => {
            ElNotification({
              title: useLocale().getComposer().t("notification.warning.title"),
              message: "无法加载Quilt版本清单",
            });
          });
        return quiltVersions;
      })();
    case "neoforge":
      break;
    case "spigot":
      break;
    case "paper":
      break;
    case "folia":
      break;
    case "pufferfish":
      break;
    case "purpur":
      break;
    case "bungeecord":
      break;
    case "lightfall":
      break;
    case "velocity":
      break;
    case "waterfall":
      break;
    case "arclight":
      break;
    case "catserver":
      break;
    case "mohist":
      break;
  }
}
