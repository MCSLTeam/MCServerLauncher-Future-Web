<script lang="ts" setup>
import { ref } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";

const maximizeBtnIcon = ref();

async function exitApp() {
  await exit();
}

async function minimizeApp() {
  await getCurrentWindow().minimize();
}

async function maximizeApp() {
  if (await getCurrentWindow().isMaximized()) {
    maximizeBtnIcon.value.className =
      "fas fa-up-right-and-down-left-from-center";
    document.body.classList.remove("maximized");
    await getCurrentWindow().unmaximize();
  } else {
    maximizeBtnIcon.value.className = "fas fa-down-left-and-up-right-to-center";
    document.body.classList.add("maximized");
    await getCurrentWindow().maximize();
  }
}
</script>

<template>
  <div class="window-button__container">
    <button @click="exitApp"><i class="fas fa-xmark"></i></button>
    <button @click="minimizeApp" id="window-minimize-button">
      <i class="fas fa-minus"></i>
    </button>
    <button @click="maximizeApp" id="window-maximize-button">
      <i
        class="fas fa-up-right-and-down-left-from-center"
        ref="maximizeBtnIcon"
      ></i>
    </button>
  </div>
</template>

<style scoped>
.window-button__container {
  position: fixed;
  top: 30px;
  left: 30px;
  z-index: 1000;
  align-items: center;
  justify-content: space-between;
  width: 80px;
  display: none;
}

.tauri-desktop .window-button__container {
  display: flex;
}

.window-button__container button {
  width: 24px;
  height: 24px;
  padding: 2px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-bg-color-overlay);
  font-weight: bold;
  font-size: 12px;
  border-radius: 8px;
  transition: 0.3s ease-in-out;
  box-shadow: var(--el-box-shadow-light);
}

.window-button__container button:hover {
  border: 1px solid var(--el-menu-border-color);
}
</style>
