<script setup lang="ts">
import { watch } from "vue";
import Button from "../form/button/Button.vue";
import Panel from "../panel/Panel.vue";
import { type Color, getColorVar } from "../../utils/css.ts";
import { animatedVisibilityExists } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    header?: string;
    color?: Color;
    closable?: boolean;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
  }>(),
  {
    color: "primary",
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

const { exist } = animatedVisibilityExists(visible, 200);

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
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
  } else {
    emit("close");
    document.body.style.overflow = "auto";
    window.removeEventListener("keydown", handleKeyDown);
  }
});

defineExpose({
  open,
  close,
  visible,
});
</script>

<template>
  <div v-if="exist" class="mcsl-modal">
    <div
      data-tauri-drag-region
      :class="{
        'mcsl-modal__overlay-visible': visible,
      }"
      class="mcsl-modal__overlay"
      :style="{
        '--mcsl-modal__overlay-bg': getColorVar(color),
      }"
      @click="() => (closeOnClickOutside && closable ? close() : {})"
    />
    <Panel
      v-bind="$attrs"
      class="mcsl-modal__card"
      :class="{ 'mcsl-modal__container-visible': visible }"
      size="large"
    >
      <template #header>
        <div class="mcsl-modal__header">
          <slot name="header" :open="open" :close="close" :visible="visible">
            <h2>{{ header }}</h2>
          </slot>
          <Button v-if="closable" @click="close" rounded icon="fas fa-xmark" />
        </div>
      </template>
      <slot :open="open" :close="close" :visible="visible" />
    </Panel>
  </div>
</template>

<style scoped lang="scss">
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
  width: 600px;
  max-height: calc(100% - 2 * var(--mcsl-spacing-lg));
  border-radius: var(--mcsl-border-radius-4xl);
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

  @media (max-width: 768px) {
    width: calc(100% - 2 * var(--mcsl-spacing-lg));
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
