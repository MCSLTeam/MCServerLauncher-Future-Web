import { type Locale } from "./stores.ts";

export type I18nMessages = Record<Locale, any>;

export type LoadingStatus = "loading" | "success" | "error" | "warning";

export type Size = "small" | "middle" | "large";
