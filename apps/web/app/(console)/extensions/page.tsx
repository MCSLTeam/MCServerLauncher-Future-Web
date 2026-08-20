"use client";

import { ConsolePage } from "@/components/templates/console-surface";
import { ClientExtensionCenter } from "@/features/plugins/ui-runtime/client-extension-center";

/** 对齐 WPF PluginExtensionCenterPage：扩展中心是独立页面，不并入资源下载。 */
export default function ExtensionsPage() {
  return (
    <ConsolePage className="min-h-0 flex-1 gap-0">
      <ClientExtensionCenter />
    </ConsolePage>
  );
}
