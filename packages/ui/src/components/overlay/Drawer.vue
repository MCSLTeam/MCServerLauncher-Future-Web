<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import Button from "../button/Button.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    placement?: "left" | "right" | "top" | "bottom";
    width?: string;
    height?: string;
    closable?: boolean;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
  }>(),
  {
    title: "",
    placement: "right",
    width: "420px",
    height: "360px",
    closable: true,
    closeOnEsc: true,
    closeOnClickOutside: true,
  },
);

const visible = defineModel<boolean>("visible", {
  default: false,
});

const emit = defineEmits<{
  (e: "open"): void;
  (e: "close"): void;
}>();

const isHorizontal = computed(() => props.placement === "left" || props.placement === "right");

function close() {
  if (props.closable) visible.value = false;
}

function handleKeyDown(event: KeyboardEvent) {
  if (props.closeOnEsc && event.key === "Escape") close();
}

watch(visible, (value) => {
  if (value) {
    emit("open");
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
  } else {
    emit("close");
    document.body.style.overflow = "auto";
    window.removeEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  if (visible.value) document.body.style.overflow = "auto";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="mcsl-drawer-fade">
      <div v-if="visible" class="mcsl-drawer-layer">
        <div
          class="mcsl-drawer-layer__overlay"
          @click="() => (closeOnClickOutside ? close() : undefined)"
        />
        <aside
          class="mcsl-drawer"
          :class="[`mcsl-drawer--${placement}`]"
          :style="{
            width: isHorizontal ? width : undefined,
            height: isHorizontal ? undefined : height,
          }"
          role="dialog"
          aria-modal="true"
        >
          <header class="mcsl-drawer__header">
            <slot name="header" :close="close">
              <h2>{{ title }}</h2>
            </slot>
            <Button
              v-if="closable"
              type="text"
              icon="fas fa-xmark"
              squared
              size="small"
              @click="close"
            />
          </header>
          <main class="mcsl-drawer__body">
            <slot :close="close" />
          </main>
          <footer v-if="$slots.footer" class="mcsl-drawer__footer">
            <slot name="footer" :close="close" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.mcsl-drawer-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  pointer-events: auto;
}

.mcsl-drawer-layer__overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay-opposite) 18%, transparent);
}

.mcsl-drawer {
  position: absolute;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
  box-shadow: var(--mcsl-box-shadow-dark);
  color: var(--mcsl-text-color-primary);
}

.mcsl-drawer--right {
  top: var(--mcsl-spacing-sm);
  right: var(--mcsl-spacing-sm);
  bottom: var(--mcsl-spacing-sm);
  max-width: calc(100vw - 2 * var(--mcsl-spacing-sm));
  border-radius: var(--mcsl-border-radius-sm);
}

.mcsl-drawer--left {
  top: var(--mcsl-spacing-sm);
  bottom: var(--mcsl-spacing-sm);
  left: var(--mcsl-spacing-sm);
  max-width: calc(100vw - 2 * var(--mcsl-spacing-sm));
  border-radius: var(--mcsl-border-radius-sm);
}

.mcsl-drawer--top {
  top: var(--mcsl-spacing-sm);
  right: var(--mcsl-spacing-sm);
  left: var(--mcsl-spacing-sm);
  max-height: calc(100vh - 2 * var(--mcsl-spacing-sm));
  border-radius: var(--mcsl-border-radius-sm);
}

.mcsl-drawer--bottom {
  right: var(--mcsl-spacing-sm);
  bottom: var(--mcsl-spacing-sm);
  left: var(--mcsl-spacing-sm);
  max-height: calc(100vh - 2 * var(--mcsl-spacing-sm));
  border-radius: var(--mcsl-border-radius-sm);
}

.mcsl-drawer__header,
.mcsl-drawer__footer {
  display: flex;
  gap: var(--mcsl-spacing-xs);
  align-items: center;
  justify-content: space-between;
  padding: var(--mcsl-spacing-sm);
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
}

.mcsl-drawer__footer {
  justify-content: flex-end;
  border-top: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-bottom: 0;
}

.mcsl-drawer__header h2 {
  margin: 0;
  font-size: var(--mcsl-font-size-lg);
  font-weight: 650;
}

.mcsl-drawer__body {
  min-height: 0;
  padding: var(--mcsl-spacing-sm);
  overflow: auto;
}

.mcsl-drawer-fade-enter-active,
.mcsl-drawer-fade-leave-active {
  transition: opacity 0.16s ease-out;
}

.mcsl-drawer-fade-enter-active .mcsl-drawer,
.mcsl-drawer-fade-leave-active .mcsl-drawer {
  transition: transform 0.18s ease-out;
}

.mcsl-drawer-fade-enter-from,
.mcsl-drawer-fade-leave-to {
  opacity: 0;
}

.mcsl-drawer-fade-enter-from .mcsl-drawer--right,
.mcsl-drawer-fade-leave-to .mcsl-drawer--right {
  transform: translateX(calc(100% + var(--mcsl-spacing-sm)));
}

.mcsl-drawer-fade-enter-from .mcsl-drawer--left,
.mcsl-drawer-fade-leave-to .mcsl-drawer--left {
  transform: translateX(calc(-100% - var(--mcsl-spacing-sm)));
}

.mcsl-drawer-fade-enter-from .mcsl-drawer--top,
.mcsl-drawer-fade-leave-to .mcsl-drawer--top {
  transform: translateY(calc(-100% - var(--mcsl-spacing-sm)));
}

.mcsl-drawer-fade-enter-from .mcsl-drawer--bottom,
.mcsl-drawer-fade-leave-to .mcsl-drawer--bottom {
  transform: translateY(calc(100% + var(--mcsl-spacing-sm)));
}
</style>
