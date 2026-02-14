<script lang="ts" setup>
// Cleanup focus trap on component unmount
import { onUnmounted, ref, watch } from "vue";
import Button from "../form/button/Button.vue";
import Panel from "../panel/Panel.vue";
import { type Color, getColorVar } from "../../utils/css.ts";
import { animatedVisibilityExists } from "../../utils/internal.ts";
import { createFocusTrap } from "focus-trap";

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
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
    autoClose?: boolean;
  }>(),
  {
    maxWidth: "600px",
    color: "primary",
    headerDivider: true,
    closable: true,
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
  (e: "closing"): void;
  (e: "close"): void;
}>();

const { exist } = animatedVisibilityExists(visible, 200);

// Focus trap instance
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
    emit("open");
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
    emit("close");
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
});
</script>

<template>
  <div v-if="exist" ref="modalRef" class="mcsl-modal">
    <div
      :class="{
        'mcsl-modal__overlay-visible': visible,
      }"
      :style="{
        '--mcsl-modal__overlay-bg': getColorVar(color),
      }"
      class="mcsl-modal__overlay"
      @click="() => (closeOnClickOutside && closable ? close() : {})"
    />
    <Panel
      :class="{ 'mcsl-modal__container-visible': visible }"
      :style="{
        '--mcsl-modal__card-max-width': maxWidth,
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
            v-if="closable"
            type="text"
            icon="fas fa-xmark"
            rounded
            @click="close"
          />
        </div>
      </template>
      <slot :close="close" :open="open" :visible="visible" />
    </Panel>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";

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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 1001;
  background: linear-gradient(
    to bottom,
    utils.transparent(var(--mcsl-modal__overlay-bg), 5%),
    utils.transparent(var(--mcsl-modal__overlay-bg), 10%)
  );

  animation: 0.2s ease-in-out both mcsl-modal__overlay-out;

  &.mcsl-modal__overlay-visible {
    animation: 0.2s ease-in-out both mcsl-modal__overlay-in;
  }
}

.mcsl-modal__card {
  width: min(
    var(--mcsl-modal__card-max-width),
    calc(100% - 4 * var(--mcsl-spacing-xl))
  );
  max-height: calc(100% - 2 * var(--mcsl-spacing-xl));
  border-radius: var(--mcsl-border-radius-2xl);
  z-index: 1002;
  animation: 0.2s ease-in-out both fadeOutDown;

  &.mcsl-modal__container-visible {
    animation: 0.2s ease-in-out fadeInUp;
  }

  & .mcsl-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

@keyframes mcsl-modal__overlay-in {
  from {
    opacity: 0;
    backdrop-filter: none;
  }
  to {
    opacity: 1;
    backdrop-filter: blur(5px);
  }
}

@keyframes mcsl-modal__overlay-out {
  from {
    opacity: 1;
    backdrop-filter: blur(5px);
  }
  to {
    opacity: 0;
    backdrop-filter: none;
  }
}
</style>
