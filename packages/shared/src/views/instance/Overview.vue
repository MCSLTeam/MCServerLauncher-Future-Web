<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";
import { Line } from "vue-chartjs";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { type ChartData, type ChartOptions } from "chart.js";
import dayjs from "dayjs";
import { formatDate, randNum } from "@repo/ui/src/utils/utils.ts";
import { chartDatasetColor, registerChart } from "../../utils/chart.ts";
import { useI18n } from "vue-i18n";

registerChart();
const t = useI18n().t;
const info = inject<any>("instance");
const totalMemory = 2 * 1024 ** 3;
const totalMemoryInMiB = totalMemory / 1024 ** 2;

const sysData = ref<[string, [number, number]][]>([]);
const chartData = computed(
  () =>
    ({
      labels: sysData.value.map(([label, _]) => label),
      datasets: [
        {
          label: t("shared.instance.overview.performance.cpu.label"),
          data: sysData.value.map(([_, value]) => value[0]),
          tension: 0.1,
          yAxisID: "y",
          ...chartDatasetColor("blue"),
        },
        {
          label: t("shared.instance.overview.performance.mem.label"),
          data: sysData.value.map(([_, value]) =>
            (value[1] / 1024 ** 2).toFixed(1),
          ),
          tension: 0.1,
          yAxisID: "y1",
          ...chartDatasetColor("emerald"),
        },
      ],
    }) as ChartData<"line">,
);

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      position: "left",
      ticks: {
        stepSize: 10,
        autoSkip: false,
      },
      title: {
        display: true,
        text: t("shared.instance.overview.performance.cpu.title"),
      },
    },
    y1: {
      position: "right",
      suggestedMax: totalMemory / 1024 ** 2,
      suggestedMin: 0,
      title: {
        display: true,
        text: t("shared.instance.overview.performance.mem.title"),
      },
    },
    x: {
      title: {
        display: true,
        text: t("shared.instance.overview.performance.time"),
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label(context) {
          if (context.datasetIndex == 0)
            return `${context.dataset.label}: ${context.raw} %`;
          if (context.datasetIndex == 1)
            return `${context.dataset.label}: ${context.raw}/ ${totalMemoryInMiB.toFixed(1)} MiB`;
        },
      },
    },
  },
};

function updateFakeData() {
  const lastSys = sysData.value[sysData.value.length - 1]?.[1] ?? [
    50,
    1024 ** 3,
  ];
  if (sysData.value.length >= 40) sysData.value.shift();
  const randomCPU = Math.min(
    100,
    Math.max(0, lastSys[0] + Number(randNum(-5, 5).toFixed(1))),
  );
  const randomMem = Math.min(
    totalMemory,
    Math.max(0, lastSys[1] + randNum(-512 * 1024 ** 2, 512 * 1024 ** 2)),
  );
  sysData.value.push([formatDate(dayjs(), "time"), [randomCPU, randomMem]]);
}

onMounted(() => {
  updateFakeData();
  setInterval(updateFakeData, 1000);
});
</script>

<template>
  <Panel :header="t('shared.instance.overview.performance.title')">
    <div class="overview__performance">
      <Line
        :id="`instance-overview-${info.id}-cpu`"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.overview__performance {
  height: 250px;
}
</style>
