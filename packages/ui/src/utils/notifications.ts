import type { MessageProps } from "../components/panel/Message.vue";
import { reactive, ref, type VueElement } from "vue";
import { randNum } from "./util.ts";

type TemplateInfo = {
  props: (data: any) => MessageProps;
  template: (props: any) => VueElement[];
};

export class Notification {
  readonly id: string;
  readonly template: TemplateInfo;
  readonly duration: number;
  readonly data: any;
  readonly opened = ref(false);
  private _closed: boolean = false;

  constructor(settings: {
    template?: string;
    duration?: number;
    open?: boolean;
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
    addNotification(this);
    if (settings.open != false) this.open();
  }

  get element(): VueElement {
    return this.template.template(this.data)[0]!;
  }

  open() {
    if (this._closed) return;
    this.opened.value = true;
    setTimeout(() => {
      this.close();
    }, this.duration);
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    this.opened.value = false;
    setTimeout(() => {
      removeNotification(this.id);
    }, 200); // 等待动画
  }
}

const templates: Record<string, TemplateInfo> = {};

export function addTemplate(
  id: string,
  props: (data: any) => MessageProps,
  template: (data: any) => VueElement[],
) {
  templates[id] = {
    props,
    template,
  };
}

export function removeTemplate(id: string) {
  delete templates[id];
}

export function getTemplate(id: string) {
  return templates[id];
}

export const notifications = reactive<Record<string, Notification>>({});

export function addNotification(notification: Notification) {
  notifications[notification.id] = notification;
}

export function removeNotification(id: string) {
  delete notifications[id];
}
