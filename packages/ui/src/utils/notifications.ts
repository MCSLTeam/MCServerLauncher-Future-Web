import type { MessageProps } from "../components/panel/Message.vue";
import { reactive, ref, type VueElement } from "vue";
import { randNum } from "./util.ts";

type TemplateInfo = {
  props: (data: any) => MessageProps;
  systemNotif: (
    data: any,
  ) => { title: string; body: string; image: string } | undefined;
  template: (props: any) => VueElement[];
};

export type NotificationType = "mcsl" | "system" | "both";

export class MCSLNotif {
  readonly id: string;
  readonly template: TemplateInfo;
  readonly duration: number;
  readonly data: any;
  readonly type: NotificationType;
  readonly opened = ref(false);
  private systemNotif: Notification | undefined;
  private _closed: boolean = false;

  constructor(settings: {
    template?: string;
    duration?: number;
    type?: "mcsl" | "system" | "both";
    data: any;
  }) {
    this.id = randNum().toString();
    const templateId = settings.template ?? "default";
    if (!templates[templateId]) {
      console.warn(`[MCSL-UI] Notification template '${templateId}' not found`);
      throw new Error(`Notification template '${templateId}' not found`);
    }
    this.template = templates[templateId];
    this.duration = settings.duration ?? 3000;
    this.data = settings.data;
    this.type = settings.type ?? "mcsl";
    addNotification(this);
  }

  get element(): VueElement {
    return this.template.template(this.data)[0]!;
  }

  open() {
    if (this._closed) return;
    this.opened.value = true;
    if (
      Notification.permission == "granted" &&
      (this.type == "system" || this.type == "both")
    ) {
      const systemNotif = this.template.systemNotif(this.data);
      if (systemNotif) {
        this.systemNotif = new Notification(systemNotif.title, {
          body: systemNotif.body,
          icon: systemNotif.image,
        });
      }
    }
    setTimeout(() => {
      this.close();
    }, this.duration);
  }

  get isMcsl() {
    return this.type == "mcsl" || this.type == "both";
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    this.opened.value = false;
    this.systemNotif?.close();
    setTimeout(() => {
      removeNotification(this.id);
    }, 500); // 等待动画
  }
}

const templates: Record<string, TemplateInfo> = {};

export function addTemplate(
  id: string,
  props: (data: any) => MessageProps,
  systemNotif: (
    data: any,
  ) => { title: string; body: string; image: string } | undefined,
  template: (data: any) => VueElement[],
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

export const notifications = reactive<Record<string, MCSLNotif>>({});

export function addNotification(notification: MCSLNotif) {
  notifications[notification.id] = notification;
}

export function removeNotification(id: string) {
  delete notifications[id];
}
