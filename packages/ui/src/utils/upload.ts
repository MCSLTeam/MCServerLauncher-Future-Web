import { MCSLNotif } from "./notifications.ts";
import { useLocale } from "./stores.ts";
import { ref } from "vue";
import { humanReadableSize } from "./utils.ts";
import mime from "mime";

export type UploadConfig = {
  accept: string[];
  maxCount: number;
  maxSize: number;
};

export const isDragging = ref(false);

export async function openFileSelector(
  config: Partial<UploadConfig>,
): Promise<File[]> {
  const { accept = [], maxCount = 1 } = config;
  const input = document.createElement("input");
  input.type = "file";
  if (accept.length > 0) input.accept = accept.join(", ");
  input.multiple = maxCount > 1;
  input.click();
  return new Promise((resolve, reject) => {
    const handleChange = () => {
      try {
        resolve(handleUpload(input.files, config));
      } catch (e) {
        reject(e);
      }
    };
    const handleFocus = () => {
      setTimeout(() => {
        input.removeEventListener("change", handleChange);
        window.removeEventListener("focus", handleFocus);
      }, 500);
    };
    input.addEventListener("change", handleChange);
    window.addEventListener("focus", handleFocus);
  });
}

export function handleUpload(
  files: FileList | null,
  config: Partial<UploadConfig>,
): File[] {
  const t = useLocale().getI18n().t;
  const { accept = [], maxCount = 1, maxSize = 0 } = config;

  let result: File[] = [];
  if (files && files.length > 0)
    for (const file of files) {
      if (maxSize > 0 && file.size > maxSize) {
        new MCSLNotif({
          data: {
            title: t("ui.notification.title.error"),
            message: t("ui.upload.error.size", {
              filename: file.name,
              maxSize: humanReadableSize(maxSize),
            }),
          },
        }).open();
        continue;
      }
      if (accept.length > 0 && !accept.includes(file.type)) {
        new MCSLNotif({
          data: {
            title: t("ui.notification.title.error"),
            message: t("ui.upload.error.accept", {
              filename: file.name,
              accept: accept.map((m) => mime.getExtension(m)).join(", "),
            }),
          },
        }).open();
        continue;
      }
      result.push(file);
    }
  else
    new MCSLNotif({
      data: {
        title: t("ui.notification.title.error"),
        message: t("ui.upload.error.empty"),
      },
    }).open();

  if (maxCount > 0 && result.length > maxCount) {
    new MCSLNotif({
      data: {
        title: t("ui.notification.title.warning"),
        message: t("ui.upload.error.count", { maxCount }),
      },
    }).open();
    result = result.slice(0, maxCount);
  }

  return result;
}
