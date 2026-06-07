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
      <section class="gallery-hero">
        <div class="gallery-hero__content">
          <p class="gallery-kicker">Design Review</p>
          <h1>MCSL Future UI Gallery</h1>
          <p class="gallery-subtitle">
            Private UI component library for MCSL Future.
          </p>
        </div>
        <Panel class="gallery-hero__controls" size="small" shadow="hover">
          <template #header>
            <h3>Preview Controls</h3>
          </template>
          <div class="gallery-controls">
            <label class="gallery-toggle">
              <input v-model="showDense" type="checkbox" />
              <span>Dense spacing</span>
            </label>
            <label class="gallery-toggle">
              <input v-model="showStrongAccent" type="checkbox" />
              <span>Stronger accent surfaces</span>
            </label>
          </div>
        </Panel>
      </section>

      <section class="gallery-docs">
        <aside class="gallery-docs__sidebar">
          <Panel size="small" shadow="hover">
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
  height: auto !important;
  min-height: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
}

.gallery-page {
  position: relative;
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
  width: min(1440px, calc(100vw - 20px));
  height: 100vh;
  margin: 0 auto;
  padding: 20px 0 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
}

.gallery-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.gallery-kicker {
  margin: 0 0 8px;
  font-size: var(--mcsl-font-size-sm);
  font-weight: var(--mcsl-font-weight-bolder);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--mcsl-color-primary);
}

.gallery-hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 4vw, 4.25rem);
  line-height: 1.02;
  font-weight: 620;
  letter-spacing: -0.03em;
}

.gallery-subtitle {
  margin: 18px 0 0;
  max-width: 760px;
  font-size: var(--mcsl-font-size-xl);
  line-height: 1.65;
  color: var(--mcsl-text-color-regular);
}

.gallery-controls {
  display: grid;
  gap: 12px;
}

.gallery-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--mcsl-text-color-regular);
}

.gallery-docs {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-height: 0;
}

.gallery-docs__sidebar {
  min-height: 0;

  :deep(.mcsl-panel) {
    height: 100%;
  }

  :deep(.mcsl-panel__body-wrapper) {
    max-height: 100%;
    overflow-y: auto;
  }
}

.gallery-docs__content {
  display: grid;
  gap: 18px;
  min-width: 0;
  min-height: 0;
  align-content: start;
  overflow-y: auto;
  padding-right: 2px;
}

.gallery-breadcrumbs {
  margin-bottom: 2px;
}

.gallery--dense .gallery-shell {
  width: min(1220px, calc(100vw - 40px));
}

.gallery--strong-accent .gallery-kicker {
  color: var(--mcsl-color-primary-dark);
}

@media (max-width: 980px) {
  .gallery-shell {
    width: min(100vw - 12px, 100%);
    height: auto;
    min-height: 100vh;
    padding: 16px 0 20px;
  }

  .gallery-hero,
  .gallery-docs {
    grid-template-columns: 1fr;
  }

  .gallery-docs__sidebar {
    min-height: auto;
  }

  .gallery-docs__content {
    overflow-y: visible;
  }
}

.gallery-notif-btn {
  margin: var(--mcsl-spacing-4xs) var(--mcsl-spacing-2xs) 0 auto;
}
</style>
