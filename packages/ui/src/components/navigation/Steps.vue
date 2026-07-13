<script setup lang="ts">
import { computed } from "vue";
import { ColorData, type ColorType, getColorVar } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

export type StepStatus = "wait" | "process" | "finish" | "error";

export type StepItem = {
  title: string;
  description?: string;
  icon?: string;
  status?: StepStatus;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    items: StepItem[];
    color?: ColorType;
    size?: Size;
    vertical?: boolean;
    clickable?: boolean;
  }>(),
  {
    color: "primary",
    size: "medium",
    vertical: false,
    clickable: false,
  },
);

const model = defineModel<number>({
  default: 0,
});

const emit = defineEmits<{
  (e: "change", value: number): void;
}>();

const normalizedCurrent = computed(() => {
  if (!props.items.length) return 0;
  return Math.min(Math.max(model.value, 0), props.items.length - 1);
});

function getStatus(index: number, item: StepItem): StepStatus {
  if (item.status) return item.status;
  if (index < normalizedCurrent.value) return "finish";
  if (index === normalizedCurrent.value) return "process";
  return "wait";
}

function getIcon(index: number, item: StepItem) {
  if (item.icon) return item.icon;
  const status = getStatus(index, item);
  if (status === "finish") return "fas fa-check";
  if (status === "error") return "fas fa-xmark";
  return "";
}

function selectStep(index: number, item: StepItem) {
  if (!props.clickable || item.disabled) return;
  model.value = index;
  emit("change", index);
}
</script>

<template>
  <ol
    class="mcsl-steps"
    :class="[
      `mcsl-size-${size}`,
      {
        'mcsl-steps--vertical': vertical,
        'mcsl-steps--clickable': clickable,
      },
    ]"
    :style="{
      '--mcsl-steps__color': getColorVar(color),
      '--mcsl-steps__color-soft': new ColorData(
        color,
        'default',
        0.14,
      ).getCss(),
    }"
  >
    <li
      v-for="(item, index) in items"
      :key="`${item.title}-${index}`"
      class="mcsl-steps__item"
      :class="[
        `mcsl-steps__item--${getStatus(index, item)}`,
        {
          'mcsl-steps__item--disabled': item.disabled,
        },
      ]"
      :aria-current="index === normalizedCurrent ? 'step' : undefined"
    >
      <button
        type="button"
        class="mcsl-steps__button"
        :disabled="!clickable || item.disabled"
        @click="selectStep(index, item)"
      >
        <span class="mcsl-steps__indicator">
          <i v-if="getIcon(index, item)" :class="getIcon(index, item)" />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span class="mcsl-steps__content">
          <span class="mcsl-steps__title">{{ item.title }}</span>
          <span v-if="item.description" class="mcsl-steps__description">
            {{ item.description }}
          </span>
        </span>
      </button>
    </li>
  </ol>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";
@use "../SmallerContent" as *;

.mcsl-steps {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
  color: var(--mcsl-text-color-regular);
  --mcsl-steps__track-size: 2px;
  --mcsl-steps__track-color: color-mix(
    in srgb,
    var(--mcsl-border-color-base) 74%,
    transparent
  );
  --mcsl-steps__surface: color-mix(
    in srgb,
    var(--mcsl-bg-color-overlay) 94%,
    var(--mcsl-bg-color-main)
  );
}

.mcsl-steps--vertical {
  flex-direction: column;
}

.mcsl-steps__item {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
}

.mcsl-steps__item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: calc(
    (var(--mcsl-steps__indicator-size) - var(--mcsl-steps__track-size)) / 2
  );
  left: calc(var(--mcsl-steps__indicator-size) + var(--mcsl-spacing-sm));
  right: var(--mcsl-spacing-sm);
  height: var(--mcsl-steps__track-size);
  border-radius: 999px;
  background: var(--mcsl-steps__track-color);
  transition:
    background-color var(--mcsl-motion-duration-base)
      var(--mcsl-motion-ease-standard),
    opacity var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-steps--vertical .mcsl-steps__item {
  flex: 0 0 auto;
  width: 100%;
  min-height: calc(var(--mcsl-steps__indicator-size) + var(--mcsl-spacing-lg));
}

.mcsl-steps--vertical .mcsl-steps__item:not(:last-child) {
  padding-bottom: var(--mcsl-spacing-lg);
}

.mcsl-steps--vertical .mcsl-steps__item:not(:last-child)::after {
  top: calc(var(--mcsl-steps__indicator-size) + var(--mcsl-spacing-xs));
  bottom: var(--mcsl-spacing-xs);
  left: calc(
    (var(--mcsl-steps__indicator-size) - var(--mcsl-steps__track-size)) / 2
  );
  right: auto;
  width: var(--mcsl-steps__track-size);
  height: auto;
}

.mcsl-steps__button {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  width: 100%;
  gap: var(--mcsl-spacing-sm);
  padding: 0 var(--mcsl-spacing-sm) 0 0;
  border: 0;
  border-radius: var(--mcsl-border-radius-sm);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: default;
  outline: 0;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-steps--clickable .mcsl-steps__button:not(:disabled) {
  cursor: pointer;
}

.mcsl-steps--clickable .mcsl-steps__button:not(:disabled):hover {
  color: var(--mcsl-steps__color);
}

.mcsl-steps--clickable .mcsl-steps__button:not(:disabled):focus-visible {
  box-shadow: 0 0 0 3px var(--mcsl-steps__color-soft);
}

.mcsl-steps__indicator {
  display: inline-grid;
  place-items: center;
  width: var(--mcsl-steps__indicator-size);
  height: var(--mcsl-steps__indicator-size);
  border: 1px solid
    color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--mcsl-steps__surface) 96%, white 4%),
    var(--mcsl-steps__surface)
  );
  color: var(--mcsl-text-color-secondary);
  font-weight: 650;
  line-height: 1;
  box-shadow:
    0 1px 1px color-mix(in srgb, var(--mcsl-text-color-primary) 7%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 22%, transparent);
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard),
    box-shadow var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-steps__content {
  display: grid;
  gap: var(--mcsl-spacing-4xs);
  min-width: 0;
  padding-top: 2px;
}

.mcsl-steps__title {
  color: var(--mcsl-text-color-primary);
  font-weight: 680;
  line-height: 1.28;
  transition: color var(--mcsl-motion-duration-fast)
    var(--mcsl-motion-ease-standard);
}

.mcsl-steps__description {
  color: var(--mcsl-text-color-secondary);
  line-height: 1.45;
}

.mcsl-steps__item--finish {
  &::after {
    background: color-mix(
      in srgb,
      var(--mcsl-steps__color) 58%,
      var(--mcsl-steps__track-color)
    );
  }

  .mcsl-steps__indicator {
    border-color: color-mix(
      in srgb,
      var(--mcsl-steps__color) 42%,
      var(--mcsl-border-color-base)
    );
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--mcsl-steps__color-soft) 72%, white 10%),
      var(--mcsl-steps__color-soft)
    );
    color: var(--mcsl-steps__color);
  }
}

.mcsl-steps__item--process {
  .mcsl-steps__indicator {
    border-color: color-mix(in srgb, var(--mcsl-steps__color) 76%, transparent);
    background: var(--mcsl-steps__color);
    color: var(--mcsl-text-color-light);
    box-shadow:
      0 0 0 4px var(--mcsl-steps__color-soft),
      0 5px 14px color-mix(in srgb, var(--mcsl-steps__color) 18%, transparent),
      inset 0 1px 0 color-mix(in srgb, white 28%, transparent);
  }

  .mcsl-steps__title {
    color: var(--mcsl-steps__color);
  }
}

.mcsl-steps__item--error {
  &::after {
    background: color-mix(
      in srgb,
      var(--mcsl-color-danger) 34%,
      var(--mcsl-steps__track-color)
    );
  }

  .mcsl-steps__indicator {
    border-color: color-mix(
      in srgb,
      var(--mcsl-color-danger) 52%,
      var(--mcsl-border-color-base)
    );
    background: linear-gradient(
      180deg,
      color-mix(
        in srgb,
        var(--mcsl-color-danger) 13%,
        var(--mcsl-bg-color-overlay)
      ),
      color-mix(
        in srgb,
        var(--mcsl-color-danger) 8%,
        var(--mcsl-bg-color-overlay)
      )
    );
    color: var(--mcsl-color-danger);
    box-shadow: 0 0 0 4px
      color-mix(in srgb, var(--mcsl-color-danger) 10%, transparent);
  }

  .mcsl-steps__title {
    color: var(--mcsl-color-danger);
  }
}

.mcsl-steps__item--disabled {
  opacity: 0.52;

  .mcsl-steps__button {
    cursor: not-allowed;
  }
}

.mcsl-steps--clickable
  .mcsl-steps__button:not(:disabled):hover
  .mcsl-steps__indicator {
  border-color: color-mix(
    in srgb,
    var(--mcsl-steps__color) 48%,
    var(--mcsl-border-color-base)
  );
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--mcsl-steps__color-soft) 70%, transparent),
    0 3px 10px color-mix(in srgb, var(--mcsl-steps__color) 12%, transparent);
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-steps {
    @if $size == "small" {
      --mcsl-steps__indicator-size: 20px;
    } @else if $size == "large" {
      --mcsl-steps__indicator-size: 28px;
    } @else {
      --mcsl-steps__indicator-size: 24px;
    }

    font-size: utils.get-size-var("font-size", $size, $vars);
  }
}

@media (max-width: 640px) {
  .mcsl-steps:not(.mcsl-steps--vertical) {
    flex-direction: column;
  }

  .mcsl-steps:not(.mcsl-steps--vertical) .mcsl-steps__item {
    width: 100%;
    min-height: calc(
      var(--mcsl-steps__indicator-size) + var(--mcsl-spacing-lg)
    );
  }

  .mcsl-steps:not(.mcsl-steps--vertical) .mcsl-steps__item:not(:last-child) {
    padding-bottom: var(--mcsl-spacing-lg);
  }

  .mcsl-steps:not(.mcsl-steps--vertical)
    .mcsl-steps__item:not(:last-child)::after {
    top: calc(var(--mcsl-steps__indicator-size) + var(--mcsl-spacing-xs));
    bottom: var(--mcsl-spacing-xs);
    left: calc(
      (var(--mcsl-steps__indicator-size) - var(--mcsl-steps__track-size)) / 2
    );
    right: auto;
    width: var(--mcsl-steps__track-size);
    height: auto;
  }
}
</style>
