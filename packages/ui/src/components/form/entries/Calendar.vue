<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";
import Button from "../../button/Button.vue";
import type { ColorType } from "../../../utils/css.ts";
import { ColorData, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    size?: Size;
    min?: string;
    max?: string;
    disabledDate?: (date: string) => boolean;
  }>(),
  {
    color: "primary",
    size: "medium",
    min: undefined,
    max: undefined,
    disabledDate: undefined,
  },
);

const model = defineModel<string>({
  default: "",
});

const cursor = ref(model.value ? dayjs(model.value) : dayjs());

watch(model, (value) => {
  if (value) cursor.value = dayjs(value);
});

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const title = computed(() => cursor.value.format("MMMM YYYY"));

const days = computed(() => {
  const startOfMonth = cursor.value.startOf("month");
  const firstWeekday = (startOfMonth.day() + 6) % 7;
  const start = startOfMonth.subtract(firstWeekday, "day");

  return Array.from({ length: 42 }, (_, index) => {
    const date = start.add(index, "day");
    const value = date.format("YYYY-MM-DD");
    const disabled =
      (props.min ? date.isBefore(dayjs(props.min), "day") : false) ||
      (props.max ? date.isAfter(dayjs(props.max), "day") : false) ||
      props.disabledDate?.(value) === true;

    return {
      value,
      label: date.date(),
      currentMonth: date.month() === cursor.value.month(),
      today: date.isSame(dayjs(), "day"),
      selected: value === model.value,
      disabled,
    };
  });
});

function moveMonth(delta: number) {
  cursor.value = cursor.value.add(delta, "month");
}

function selectDate(value: string, disabled: boolean) {
  if (disabled) return;
  model.value = value;
}
</script>

<template>
  <div
    class="mcsl-calendar"
    :class="[`mcsl-size-${size}`]"
    :style="{
      '--mcsl-calendar__color': getColorVar(color),
      '--mcsl-calendar__color-soft': new ColorData(
        color,
        'default',
        0.12,
      ).getCss(),
    }"
  >
    <div class="mcsl-calendar__header">
      <Button
        icon="fa fa-angle-left"
        rounded
        size="small"
        type="text"
        @click="moveMonth(-1)"
      />
      <strong>{{ title }}</strong>
      <Button
        icon="fa fa-angle-right"
        rounded
        size="small"
        type="text"
        @click="moveMonth(1)"
      />
    </div>
    <div class="mcsl-calendar__weekdays">
      <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
    </div>
    <div class="mcsl-calendar__days">
      <button
        v-for="day in days"
        :key="day.value"
        type="button"
        class="mcsl-calendar__day"
        :class="{
          'mcsl-calendar__day--muted': !day.currentMonth,
          'mcsl-calendar__day--today': day.today,
          'mcsl-calendar__day--selected': day.selected,
        }"
        :disabled="day.disabled"
        @click="selectDate(day.value, day.disabled)"
      >
        {{ day.label }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

.mcsl-calendar {
  display: grid;
  gap: var(--mcsl-spacing-xs);
  width: min(100%, 20rem);
  padding: var(--mcsl-spacing-xs);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-overlay);
}

.mcsl-calendar__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);
}

.mcsl-calendar__header strong {
  color: var(--mcsl-text-color-primary);
  font-weight: 650;
  text-align: center;
}

.mcsl-calendar__weekdays,
.mcsl-calendar__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.mcsl-calendar__weekdays span {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-xs);
  font-weight: 650;
  text-align: center;
}

.mcsl-calendar__day {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: var(--mcsl-border-radius-sm);
  background: transparent;
  color: var(--mcsl-text-color-regular);
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-calendar__day:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
  color: var(--mcsl-text-color-primary);
}

.mcsl-calendar__day--muted {
  color: var(--mcsl-text-color-secondary);
}

.mcsl-calendar__day--today {
  border-color: color-mix(
    in srgb,
    var(--mcsl-calendar__color) 38%,
    transparent
  );
}

.mcsl-calendar__day--selected {
  border-color: var(--mcsl-calendar__color);
  background: var(--mcsl-calendar__color);
  color: var(--mcsl-text-color-light);
}

.mcsl-calendar__day:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-calendar {
    font-size: utils.get-size-var("font-size", $size, $vars);
  }
}
</style>
