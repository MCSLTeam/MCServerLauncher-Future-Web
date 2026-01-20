import type { MessageProps } from "../components/panel/Message.vue";
import { ref, shallowReactive, type VueElement } from "vue";
import { useLocale } from "./stores.ts";
import { useLocalStorage } from "@vueuse/core";

type TemplateInfo = {
  props: (notif: MCSLNotif) => MessageProps;
  systemNotif: (notif: MCSLNotif) => { title: string; body: string };
  template: (notif: MCSLNotif) => VueElement[];
};

export type NotificationType = "mcsl" | "system" | "both";

export type SystemNotifSettings = {
  supported: boolean;
  requestPermission: () => Promise<void>;
  isPermissionGranted: () => "default" | "granted" | "denied";
  send: (title: string, body: string) => Notification | undefined;
};

export type MCSLNotifSettings = {
  template?: string;
  duration?: number;
  type?: NotificationType;
  addToHistory?: boolean;
  data: any;
};

let systemNotifSettings: SystemNotifSettings = {
  supported: "Notification" in window,
  async requestPermission() {
    await Notification.requestPermission();
  },
  isPermissionGranted() {
    return Notification.permission;
  },
  send(title: string, body: string) {
    return new Notification(title ?? "", { body: body ?? "" });
  },
};

export function setSystemNotif(notif: SystemNotifSettings) {
  systemNotifSettings = notif;
}

export class MCSLNotif {
  private static idCounter = -1;

  readonly id = ++MCSLNotif.idCounter;
  readonly opened = ref(false);
  private systemNotif: Notification | undefined;
  private _closed: boolean = false;

  constructor(readonly settings: MCSLNotifSettings) {
    const templateId = settings.template ?? "default";
    if (!templates[templateId]) {
      console.warn(`[MCSL-UI] Notification template '${templateId}' not found`);
      throw new Error(`Notification template '${templateId}' not found`);
    }
    addNotif(this);
  }

  get element(): VueElement {
    return this.template.template(this)[0]!;
  }

  open() {
    if (this._closed) return;
    this.opened.value = true;
    if (Notification.permission == "granted" && this.isSystem) {
      const systemNotif = this.template.systemNotif(this);
      if (systemNotif) {
        this.systemNotif = systemNotifSettings.send(
          systemNotif.title,
          systemNotif.body,
        );
      }
    }
    if (this.settings.duration ?? 3000 > 0) {
      setTimeout(() => {
        this.close();
      }, this.settings.duration ?? 3000);
    }
  }

  get isMcsl() {
    return (
      (this.settings.type ?? "mcsl") == "mcsl" || this.settings.type == "both"
    );
  }

  get isSystem() {
    return this.settings.type == "system" || this.settings.type == "both";
  }

  get template() {
    return templates[this.settings.template ?? "default"]!;
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    this.opened.value = false;
    this.systemNotif?.close();
    setTimeout(() => {
      removeNotif(this.id);
    }, 500); // 等待动画
  }
}

const sysNotifWarning = useLocalStorage("sys-notif-warning", true);

export async function requestNotifPermission() {
  const t = useLocale().getI18n().t;
  let shouldShowWarning = false;
  if (!systemNotifSettings.supported) {
    shouldShowWarning = true;
    if (sysNotifWarning.value)
      new MCSLNotif({
        template: "do-not-show-again",
        data: {
          title: t("ui.notification.title.warning"),
          message: t("ui.notification.message.not-supported"),
          color: "warning",
          onClick: () => (sysNotifWarning.value = false),
        },
      }).open();
  } else if (systemNotifSettings.isPermissionGranted() == "default") {
    new MCSLNotif({
      data: {
        message: t("ui.notification.message.request"),
      },
    }).open();
    await systemNotifSettings.requestPermission();
    await requestNotifPermission();
  } else if (systemNotifSettings.isPermissionGranted() == "denied") {
    shouldShowWarning = true;
    if (sysNotifWarning.value)
      new MCSLNotif({
        template: "do-not-show-again",
        data: {
          title: t("ui.notification.title.warning"),
          message: t("ui.notification.message.not-allowed"),
          color: "warning",
          onClick: () => (sysNotifWarning.value = false),
        },
      }).open();
  }
  if (!shouldShowWarning) sysNotifWarning.value = true;
}

const templates: Record<string, TemplateInfo> = {};

export function addTemplate(
  id: string,
  props: (notif: MCSLNotif) => MessageProps,
  systemNotif: (notif: MCSLNotif) => { title: string; body: string },
  template: (notif: MCSLNotif) => VueElement[],
) {
  templates[id] = {
    props,
    systemNotif,
    template,
  };
}

export function removeTemplate(id: string) {
  delete templates[id];
}

export function getTemplate(id: string) {
  return templates[id];
}

export const notifications = shallowReactive<Record<number, MCSLNotif>>({});

export function addNotif(notif: MCSLNotif) {
  notifications[notif.id] = notif;
}

export function removeNotif(id: number) {
  delete notifications[id];
}
