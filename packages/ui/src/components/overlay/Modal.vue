<script lang="ts" setup>
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
    maxWidth?: string;
    header?: string;
    color?: Color;
    closable?: boolean;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
  }>(),
  {
    maxWidth: "600px",
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
      class="mcsl-modal__card"
      size="large"
      v-bind="$attrs"
    >
      <template #header>
        <div class="mcsl-modal__header">
          <slot :close="close" :open="open" :visible="visible" name="header">
            <h2>{{ header }}</h2>
          </slot>
          <Button v-if="closable" type="text" icon="fas fa-xmark" rounded @click="close" />
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
