<script setup lang="ts">
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import { onMounted, onUnmounted, ref } from "vue";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { sleep } from "@repo/ui/src/utils/utils.ts";
import { getCSSVar } from "@repo/ui/src/utils/css.ts";
import { useSettings } from "../../utils/stores.ts";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import Divider from "@repo/ui/src/components/misc/Divider.vue";

const settings = useSettings();
let term: Terminal;
const fitAddon = new FitAddon();
const termEl = ref();

let interval = -1;
function handleResize() {
  clearInterval(interval);
  let i = (interval = window.setInterval(() => {
    fitAddon.fit();
  }, 10));
  window.setTimeout(() => {
    if (i == interval) clearInterval(i);
  }, 500);
}

onMounted(async () => {
  while (getCSSVar("--mcsl-bg-color-main") == "" || !termEl.value) {
    await sleep(100);
  }

  term = new Terminal({
    fontFamily: getCSSVar("--mcsl-font-family-mono"),
    fontSize: 12,
    theme: {
      background: getCSSVar("--mcsl-bg-color-main"),
      black: getCSSVar("--mcsl-text-color-regular"),
      blue: getCSSVar("--mcsl-color-blue"),
      brightBlack: getCSSVar("--mcsl-text-color-primary"),
      brightBlue: getCSSVar("--mcsl-color-blue-light"),
      brightCyan: getCSSVar("--mcsl-color-cyan-light"),
      brightGreen: getCSSVar("--mcsl-color-green-light"),
      brightMagenta: getCSSVar("--mcsl-color-pink-light"),
      brightRed: getCSSVar("--mcsl-color-red-light"),
      brightWhite: getCSSVar("--mcsl-text-color-secondary"),
      brightYellow: getCSSVar("--mcsl-color-yellow-light"),
      cyan: getCSSVar("--mcsl-color-cyan"),
      green: getCSSVar("--mcsl-color-green"),
      magenta: getCSSVar("--mcsl-color-pink"),
      red: getCSSVar("--mcsl-color-red"),
      white: getCSSVar("--mcsl-text-color-white"),
      yellow: getCSSVar("--mcsl-color-yellow"),
      scrollbarSliderBackground: getCSSVar("--mcsl-scrollbar-color"),
      scrollbarSliderHoverBackground: getCSSVar("--mcsl-scrollbar-color"),
      scrollbarSliderActiveBackground: getCSSVar("--mcsl-scrollbar-color"),
      cursor: getCSSVar("--mcsl-text-color-primary"),
      selectionBackground: getCSSVar("--mcsl-bg-color-dark"),
      selectionInactiveBackground: getCSSVar("--mcsl-bg-color-dark"),
    },
    overviewRuler: {
      width: 4,
    },
    cursorBlink: true,
    cursorStyle: "underline",
    disableStdin: !settings.data.useTerminalInput,
  });
  term.loadAddon(fitAddon);

  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("sidebar:collapse", handleResize);

  term.open(termEl.value);

  let lastY = 0;
  termEl.value.querySelector(".xterm-screen").addEventListener("touchstart", (e) => {
    if (e.touches.length != 1) return;
    lastY = e.touches[0]!.clientY;
    e.preventDefault();
  });

  termEl.value.querySelector(".xterm-screen").addEventListener("touchmove", (e) => {
    if (e.touches.length != 1) return;
    const newY = e.touches[0]!.clientY;
    term.scrollLines(Math.round(-(newY - lastY) / 10));
    lastY = newY;
    e.preventDefault();
  });
  setInterval(() => {
    term.write("颜色代码测试\r\n");
    term.write("红色: \x1b[31m红色文本\x1b[0m\r\n");
    term.write("绿色: \x1b[32m绿色文本\x1b[0m\r\n");
    term.write("黄色: \x1b[33m黄色文本\x1b[0m\r\n");
    term.write("蓝色: \x1b[34m蓝色文本\x1b[0m\r\n");
    term.write("品红色: \x1b[35m品红色文本\x1b[0m\r\n");
    term.write("青色: \x1b[36m青色文本\x1b[0m\r\n");
    term.write("白色: \x1b[37m白色文本\x1b[0m\r\n");
  }, 500);
});

onUnmounted(() => {
  term?.dispose();
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("sidebar:collapse", handleResize);
});
</script>

<template>
  <Panel>
    <div
      class="mcsl-xterm-container"
      :class="{
        'mcsl-xterm-container__no-cursor': !settings.data.useTerminalInput,
      }"
    >
      <div ref="termEl"></div>
      <Divider v-if="!settings.data.useTerminalInput" spacing="xs" />
      <div v-if="!settings.data.useTerminalInput" class="console__input">
        <InputText placeholder="输入指令" clearable />
        <Button type="primary" color="primary" icon="fa fa-paper-plane">
          发送
        </Button>
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.console__input {
  display: flex;
  gap: var(--mcsl-spacing-2xs);
}
</style>

<style lang="scss">
.mcsl-xterm-container {
  padding: var(--mcsl-spacing-md);
  background: var(--mcsl-bg-color-main);
  border-radius: var(--mcsl-border-radius-md);
}

.mcsl-xterm-container .xterm-decoration-overview-ruler {
  display: none;
}

.mcsl-xterm-container .xterm-viewport {
  background: transparent;
}

.mcsl-xterm-container .slider {
  border-radius: var(--mcsl-border-radius-sm);
}

.mcsl-xterm-container__no-cursor .xterm-cursor {
  display: none !important;
}
</style>
