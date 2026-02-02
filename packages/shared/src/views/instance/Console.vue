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
import {useI18n} from "vue-i18n";

const settings = useSettings();
const t = useI18n().t;
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
    convertEol: true,
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
  termEl.value
    .querySelector(".xterm-screen")
    .addEventListener("touchstart", (e: TouchEvent) => {
      if (e.touches.length != 1) return;
      lastY = e.touches[0]!.clientY;
      e.preventDefault();
    });

  termEl.value
    .querySelector(".xterm-screen")
    .addEventListener("touchmove", (e: TouchEvent) => {
      if (e.touches.length != 1) return;
      const newY = e.touches[0]!.clientY;
      term.scrollLines(Math.round(-(newY - lastY) / 10));
      lastY = newY;
      e.preventDefault();
    });

  term.onData((data) => {
    if (settings.data.useTerminalInput) {
      console.log(
        `终端输入：${data} (${Array.from(data)
          .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
          .join("")})`,
      );
    }
  });
});

onUnmounted(() => {
  term?.dispose();
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("sidebar:collapse", handleResize);
});
</script>

<template>
  <Panel class="console">
    <div
      class="mcsl-xterm-container"
      :class="{
        'mcsl-xterm-container__no-cursor': !settings.data.useTerminalInput,
      }"
    >
      <div ref="termEl"></div>
      <Divider v-if="!settings.data.useTerminalInput" spacing="xs" />
      <div v-if="!settings.data.useTerminalInput" class="console__input">
        <InputText
          :placeholder="t('shared.instance.console.input.placeholder')"
          clearable
        />
        <Button type="primary" color="primary" icon="fa fa-paper-plane">
          {{ t("shared.instance.console.input.send") }}
        </Button>
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.console {
  height: calc(100% - 2 * var(--mcsl-spacing-md) - 2px);
}

.console__input {
  display: flex;
  gap: var(--mcsl-spacing-2xs);
}

.mcsl-xterm-container {
  display: flex;
  flex-direction: column;
  height: calc(100% - 2 * var(--mcsl-spacing-md));

  & > div:first-child {
    height: 0;
    flex-grow: 1;
  }
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
