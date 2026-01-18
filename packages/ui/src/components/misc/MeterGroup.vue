<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type Color, ColorData, getColorVar } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

export type MeterItem = {
  label: string;
  length: number;
  type: Color;
};

export type MeterInfo = {
  length: number;
  total?: number;
  autoSort?: boolean;
  values: MeterItem[];
  unallocated?: MeterItem;
};

const props = withDefaults(
  defineProps<{
    meter: MeterInfo;
    size?: Size;
  }>(),
  {
    size: "medium",
  },
);

const i18n = useI18n();

function getLabel(item: MeterItem) {
  return i18n.t("ui.meter-group.label", {
    label: item.label,
    percentage: ((item.length / props.meter.length) * 100).toString(),
  });
}

const actualValues = computed(() => {
  const meter = props.meter;
  const values = props.meter.values;
  const sum = values.reduce((acc, cur) => {
    return acc + cur.length;
  }, 0);
  return [
    ...(meter.autoSort != false
      ? values.sort((a, b) => b.length - a.length)
      : values),
    ...(meter.total && meter.total > sum
      ? [
          meter.unallocated ?? {
            label: i18n.t("ui.meter-group.unallocated"),
            length: meter.total - sum,
            type: new ColorData("surface", "light"),
          },
        ]
      : []),
  ];
});
</script>

<template>
  <div :class="[`mcsl-size-${size}`]" class="mcsl-meter-group">
    <div class="mcsl-meter-group__bar">
      <div
        v-for="(item, index) in actualValues"
        :key="index"
        v-tooltip="getLabel(item)"
        :style="{
          '--mcsl-meter-group__width': (item.length / meter.length) * 100 + '%',
          '--mcsl-meter-group__color': getColorVar(item.type!),
        }"
        class="mcsl-meter-group__item"
      />
    </div>
    <div class="mcsl-meter-group__label">
      <span
        v-for="(item, index) in actualValues"
        :key="index"
        :style="{
          '--mcsl-meter-group__color': getColorVar(item.type!),
        }"
        class="mcsl-meter-group__label-item"
      >
        {{ getLabel(item) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/css/utils";

$vars: (
  "stroke-width": (
    "small": 0.4rem,
    "medium": 0.6rem,
    "large": 0.75rem,
  ),
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-meter-group {
    & > .mcsl-meter-group__bar {
      height: utils.get-size-var("stroke-width", $size, $vars);
    }
  }
}

$light-color: color-mix(
  in srgb,
  var(--mcsl-meter-group__color),
  var(--mcsl-bg-color-overlay) 15%
);

$dark-color: color-mix(
  in srgb,
  var(--mcsl-meter-group__color),
  var(--mcsl-bg-color-overlay-opposite) 5%
);

.mcsl-meter-group__bar {
  width: 100%;
  position: relative;
  background: var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-full);
  overflow: hidden;
  display: flex;
  align-items: center;

  & > div {
    width: var(--mcsl-meter-group__width);
    height: 100%;
    background: $light-color;
    transition: 0.2s ease-in-out;

    &:hover {
      background: $dark-color;
    }

    &:last-child {
      border-radius: 0 var(--mcsl-border-radius-full)
        var(--mcsl-border-radius-full) 0;
    }
  }
}

.mcsl-meter-group__label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: var(--mcsl-spacing-2xs);
  gap: var(--mcsl-spacing-2xs);

  & > span {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.4rem;

    &::before {
      content: "";
      display: block;
      width: 0.4rem;
      height: 0.4rem;
      border-radius: var(--mcsl-border-radius-full);
      background: $light-color;
    }
  }
}
</style>
