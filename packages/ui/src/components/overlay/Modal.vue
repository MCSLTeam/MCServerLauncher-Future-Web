<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from "vue";
import Button from "../button/Button.vue";
import Panel from "../panel/Panel.vue";
import { type Color, getColorVar } from "../../utils/css.ts";
import { animatedVisibilityExists } from "../../utils/utils.ts";
import { createFocusTrap } from "focus-trap";
import { modals } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    maxWidth?: string;
    header?: string;
    headerDivider?: boolean;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
    scrollable?: boolean;
    color?: Color;
    closable?: boolean;
    closeBtn?: boolean;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
    autoClose?: boolean;
  }>(),
  {
    maxWidth: "600px",
    color: "primary",
    headerDivider: true,
    closable: true,
    closeBtn: true,
    closeOnEsc: true,
    closeOnClickOutside: true,
    autoClose: true,
  },
);

const visible = defineModel<boolean>("visible", {
  default: false,
});

const emit = defineEmits<{
  (e: "open"): void;
  (e: "opened"): void;
  (e: "closing"): void;
  (e: "close"): void;
  (e: "closed"): void;
}>();

const modalId = Date.now();
const modalIndex = computed(
  () => modals.value.length - modals.value.indexOf(modalId) - 1,
);
const { exist } = animatedVisibilityExists(
  visible,
  { in: 180, out: 140 },
  {
    beforeShow: () => {
      modals.value.push(modalId);
      emit("open");
      setTimeout(() => {
        if (modalRef.value) document.body.appendChild(modalRef.value);
      });
    },
    afterShow: () => emit("opened"),
    beforeHide: () => {
      emit("close");
      modals.value = modals.value.filter((id) => id != modalId);
    },
    afterHide: () => emit("closed"),
  },
);

const focusTrap = ref<ReturnType<typeof createFocusTrap> | null>(null);
const modalRef = ref<HTMLElement | null>(null);

function open() {
  visible.value = true;
}

function close() {
  emit("closing");
  if (props.autoClose) visible.value = false;
}

function handleKeyDown(event: KeyboardEvent) {
  if (props.closable && props.closeOnEsc && event.key === "Escape") {
    close();
  }
}

watch(visible, (value) => {
  if (value) {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    setTimeout(() => {
      focusTrap.value = createFocusTrap(modalRef.value!, {
        escapeDeactivates: false,
        allowOutsideClick: true,
        returnFocusOnDeactivate: true,
      });
      focusTrap.value.activate();
    }, 0);
  } else {
    document.body.style.overflow = "auto";
    window.removeEventListener("keydown", handleKeyDown);
    if (focusTrap.value) {
      focusTrap.value.deactivate();
      focusTrap.value = null;
    }
  }
});

defineExpose({
  open,
  close() {
    visible.value = false;
  },
  visible,
});

onUnmounted(() => {
  if (focusTrap.value) {
    focusTrap.value.deactivate();
  }
  modals.value = modals.value.filter((id) => id != modalId);
});
</script>

<template>
  <div v-if="exist" ref="modalRef" class="mcsl-modal">
    <slot name="modals" />
    <div
      :class="{
        'mcsl-modal__overlay-visible': visible,
      }"
      :style="{ '--mcsl-modal__overlay-accent': getColorVar(color) }"
      class="mcsl-modal__overlay"
      @click="() => (closeOnClickOutside && closable ? close() : {})"
    />
    <div
      :class="{ 'mcsl-modal__container-visible': visible }"
      class="mcsl-modal__container"
      :style="{
        '--mcsl-modal__card-max-width': maxWidth,
        '--mcsl-modal__overlay-accent': getColorVar(color),
      }"
    >
      <Panel
        :style="{
          transform: `scale(${1 - modalIndex * 0.05}) translateY(-${modalIndex * 1.25}rem)`,
        }"
        :header-divider="headerDivider"
        :header-class="headerClass"
        :header-style="headerStyle"
        :body-class="bodyClass"
        :body-style="bodyStyle"
        :scrollable="scrollable"
        class="mcsl-modal__card"
        size="large"
        v-bind="$attrs"
      >
        <template #header>
          <div class="mcsl-modal__header">
            <slot :close="close" :open="open" :visible="visible" name="header">
              <h2>{{ header }}</h2>
            </slot>
            <Button
              v-if="closable && closeBtn"
              type="text"
              icon="fas fa-xmark"
              @click="close"
            />
          </div>
        </template>
        <slot :close="close" :open="open" :visible="visible" />
      </Panel>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mcsl-modal {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mcsl-modal__overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: 1001;
  background: color-mix(
    in srgb,
    var(--mcsl-color-surface-950) 46%,
    transparent
  );
  backdrop-filter: blur(4px) saturate(0.96);
  animation: var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-exit) both
    mcsl-modal__overlay-out;
  will-change: opacity;

  &.mcsl-modal__overlay-visible {
    animation: var(--mcsl-motion-duration-base) var(--mcsl-motion-ease-enter)
      both mcsl-modal__overlay-in;
  }
}

.mcsl-modal__container {
  position: relative;
  width: min(
    var(--mcsl-modal__card-max-width),
    calc(100% - 4 * var(--mcsl-spacing-xl))
  );
  max-height: calc(100% - 2 * var(--mcsl-spacing-xl));
  z-index: 1002;
  transform-origin: center;
  animation: var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-exit) both
    mcsl-modal__card-out;
  will-change: opacity, transform;

  &::before {
    content: "";
    position: absolute;
    right: 10%;
    bottom: -3.5rem;
    left: 10%;
    height: 7rem;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(
      ellipse at 50% 50%,
      color-mix(in srgb, var(--mcsl-modal__overlay-accent) 16%, transparent) 0%,
      transparent 68%
    );
    filter: blur(18px);
    opacity: 0;
    transition: opacity var(--mcsl-motion-duration-base)
      var(--mcsl-motion-ease-standard);
  }

  &.mcsl-modal__container-visible {
    animation: var(--mcsl-motion-duration-base) var(--mcsl-motion-ease-enter)
      both mcsl-modal__card-in;

    &::before {
      opacity: 1;
    }
  }
}

.mcsl-modal__card {
  width: 100%;
  max-height: inherit;
  border-radius: var(--mcsl-border-radius-sm);

  & .mcsl-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    & > button {
      border-radius: var(--mcsl-border-radius-sm);
    }
  }
}

@keyframes mcsl-modal__overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes mcsl-modal__overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes mcsl-modal__card-in {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes mcsl-modal__card-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(3px) scale(0.99);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mcsl-modal__overlay,
  .mcsl-modal__container {
    animation: none !important;
    transition: none !important;
  }
}
</style>
