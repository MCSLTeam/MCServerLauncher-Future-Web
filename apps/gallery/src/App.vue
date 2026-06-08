<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Background } from "@repo/ui";
import { Panel } from "@repo/ui";
import { Button } from "@repo/ui";
import { Breadcrumbs } from "@repo/ui";
import { Sidebar } from "@repo/ui";
import { NotificationTemplate } from "@repo/ui";
import { NotificationOverlay } from "@repo/ui";
import { ContextmenuOverlay } from "@repo/ui";

const showDense = ref(false);
const showStrongAccent = ref(false);
const t = useI18n().t;

const pageClass = computed(() => ({
  "gallery--dense": showDense.value,
  "gallery--strong-accent": showStrongAccent.value,
}));

const breadcrumbs = [
  { label: "MCSL Future" },
  { label: "UI Gallery" },
];

const sidebarPages = [
  { label: "Component Gaps", link: "/components/gaps" },
  { label: "PageHeader", link: "/components/page-header" },
  { label: "Buttons", link: "/components/buttons" },
  { label: "Input", link: "/components/input" },
  { label: "NumberBox", link: "/components/number-box" },
  { label: "Select", link: "/components/select" },
  { label: "Slider", link: "/components/slider" },
  { label: "Radio", link: "/components/radio" },
  { label: "Checkbox", link: "/components/checkbox" },
  { label: "Toggle", link: "/components/toggle" },
  { label: "Message", link: "/components/message" },
  { label: "Result", link: "/components/result" },
  { label: "Empty", link: "/components/empty" },
  { label: "Divider", link: "/components/divider" },
  { label: "CopyableText", link: "/components/copyable-text" },
  { label: "Skeleton", link: "/components/skeleton" },
  { label: "Breadcrumbs", link: "/components/breadcrumbs" },
  { label: "Sidebar", link: "/components/sidebar" },
  { label: "NavTabs", link: "/components/nav-tabs" },
  { label: "Dropdown", link: "/components/dropdown" },
  { label: "Drawer", link: "/components/drawer" },
  { label: "ConfirmDialog", link: "/components/confirm-dialog" },
  { label: "Tooltip", link: "/components/tooltip" },
  { label: "Popover", link: "/components/popover" },
  { label: "Modal", link: "/components/modal" },
  { label: "Contextmenu", link: "/components/contextmenu" },
  { label: "Progress", link: "/components/progress" },
  { label: "Pagination", link: "/components/pagination" },
  { label: "Upload", link: "/components/upload" },
  { label: "Avatar", link: "/components/avatar" },
  { label: "Tag", link: "/components/tag" },
  { label: "Table", link: "/components/table" },
  { label: "Kbd", link: "/components/kbd" },
  { label: "Editor", link: "/components/editor" },
  { label: "Compositions", link: "/components/compositions" },
];
</script>

<template>
  <div :class="pageClass" class="gallery-page">
    <Background class="gallery-bg" />

    <main class="gallery-shell">
      <header class="gallery-topbar">
        <div class="gallery-brand">
          <strong>MCSL UI</strong>
          <span>Component Gallery</span>
        </div>
        <div class="gallery-controls">
          <label class="gallery-toggle">
            <input v-model="showDense" type="checkbox" />
            <span>Dense</span>
          </label>
          <label class="gallery-toggle">
            <input v-model="showStrongAccent" type="checkbox" />
            <span>Accent</span>
          </label>
        </div>
      </header>

      <section class="gallery-docs">
        <aside class="gallery-docs__sidebar">
          <Panel size="small" shadow="hover" scrollable>
            <template #header>
              <h3>Components</h3>
            </template>
            <Sidebar :pages="sidebarPages" />
          </Panel>
        </aside>

        <section class="gallery-docs__content">
          <div class="gallery-breadcrumbs">
            <Breadcrumbs :items="breadcrumbs" />
          </div>
          <RouterView />
        </section>
      </section>
    </main>

    <NotificationTemplate
      id="default"
      :props="
        (notif) => ({
          ...notif.settings.data,
          inAnim: '0.2s cubic-bezier(0.18, 0.89, 0.32, 1.13) both fadeInRight',
        })
      "
    >
      <template v-slot="notif">
        <p>{{ notif.settings.data.message }}</p>
      </template>
    </NotificationTemplate>
    <NotificationTemplate id="do-not-show-again">
      <template v-slot="notif">
        <div>
          <p>{{ notif.settings.data.message }}</p>
          <Button
            class="gallery-notif-btn"
            type="primary"
            :color="notif.settings.data.color"
            @click="
              () => {
                notif.settings.data.onClick();
                notif.close();
              }
            "
            size="small"
          >
            {{ t("ui.common.do-not-show-again") }}
          </Button>
        </div>
      </template>
    </NotificationTemplate>
    <NotificationOverlay />
    <ContextmenuOverlay />
  </div>
</template>

<style scoped lang="scss">
:global(html),
:global(html),
:global(body),
:global(#app) {
  display: block !important;
  width: 100%;
  height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
}

.gallery-page {
  position: relative;
  min-height: 100vh;
  color: var(--mcsl-text-color-primary);
}

.gallery-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.gallery-shell {
  position: relative;
  z-index: 1;
  width: min(1480px, calc(100vw - 20px));
  height: 100vh;
  margin: 0 auto;
  padding: 10px 0;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
}

.gallery-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 94%, transparent);
  box-shadow: var(--mcsl-box-shadow-light);
  backdrop-filter: blur(14px);
}

.gallery-brand {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.gallery-brand strong {
  font-size: var(--mcsl-font-size-lg);
  font-weight: 700;
}

.gallery-brand span {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
}

.gallery-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.gallery-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-sm);
}

.gallery-docs {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
  min-height: 0;
}

.gallery-docs__sidebar {
  min-height: 0;

  :deep(.mcsl-panel) {
    height: 100%;
  }
}

.gallery-docs__content {
  display: grid;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  align-content: start;
  overflow-y: auto;
  padding: 2px 2px 24px;
}

.gallery-breadcrumbs {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 82%, transparent);
  border-radius: var(--mcsl-border-radius-xs);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 92%, transparent);
  backdrop-filter: blur(12px);
}

.gallery--dense .gallery-shell {
  width: min(1320px, calc(100vw - 20px));
}

.gallery--strong-accent .gallery-topbar {
  border-color: color-mix(in srgb, var(--mcsl-color-primary) 24%, var(--mcsl-border-color-base));
}

@media (max-width: 980px) {
  :global(html),
  :global(body),
  :global(#app) {
    overflow-y: auto !important;
  }

  .gallery-shell {
    width: min(100vw - 12px, 100%);
    height: auto;
    min-height: 100vh;
    padding: 16px 0 20px;
  }

  .gallery-docs {
    grid-template-columns: 1fr;
  }

  .gallery-topbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .gallery-docs__sidebar {
    min-height: auto;

    :deep(.mcsl-panel) {
      height: auto;
      max-height: 280px;
    }

    :deep(.mcsl-panel__body-wrapper) {
      max-height: 220px;
      overflow-y: auto;
    }
  }

  .gallery-docs__content {
    overflow-y: visible;
  }
}

.gallery-notif-btn {
  margin: var(--mcsl-spacing-4xs) var(--mcsl-spacing-2xs) 0 auto;
}
</style>
