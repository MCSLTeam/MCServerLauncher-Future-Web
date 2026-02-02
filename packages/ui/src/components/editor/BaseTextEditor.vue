<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { highlightText } from "../../utils/render.ts";

const value = defineModel<string>({
  required: false,
  default: "",
});

const container = ref();
const editor = ref();
const cursorLocator = ref();
const cursor = ref();

const scrollWidth = ref(0);
const scrollHeight = ref(0);
const scrollTop = ref(0);
const scrollLeft = ref(0);

const isComposing = ref(false);

const shownText = ref("");

function refresh() {
  const text = editor.value.value;
  shownText.value = text ?? value.value;

  scrollWidth.value = editor.value.scrollWidth;
  scrollHeight.value = editor.value.scrollHeight;
  scrollTop.value = editor.value.scrollTop;
  scrollLeft.value = editor.value.scrollLeft;

  // 计算光标的位置
  const selectionEnd = editor.value.selectionEnd;
  const textBeforeCursor = text.substring(0, selectionEnd);
  cursorLocator.value.innerText = textBeforeCursor;

  // 插入元素定位光标位置
  const cuLocator = document.createElement("span");
  cuLocator.textContent = "|";
  cursorLocator.value.appendChild(cuLocator);
  cursor.value.style.transform = `translate(${cuLocator.offsetLeft - scrollLeft.value}px, ${cuLocator.offsetTop - scrollTop.value}px)`;

  // 重置动画状态
  const lastAnim = cursor.value.style.animation;
  cursor.value.style.animation = "none";
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  cursor.value.offsetHeight; // 触发重绘
  cursor.value.style.animation = lastAnim;
}

// 用于在外部更改model时同步
watch(value, (newValue) => {
  setTimeout(() => {
    if (isComposing.value) {
      // 神奇的代码取消中文输入
      editor.value.blur();
      setTimeout(() => {
        value.value = newValue;
        editor.value.focus();
      }, 0);
    } else refresh();
  }, 0);
});

onMounted(() => {
  refresh();
});
</script>

<template>
  <div
    class="mcsl-editor"
    ref="container"
    :style="{
      '--mcsl-editor__scroll-width': `${scrollWidth}px`,
      '--mcsl-editor__scroll-height': `${scrollHeight}px`,
      '--mcsl-editor__scroll-left': `${-scrollLeft}px`,
      '--mcsl-editor__scroll-top': `${-scrollTop}px`,
    }"
  >
    <div
      class="mcsl-editor__line-nums"
      :class="{
        'mcsl-editor__line-nums-shadow': scrollLeft > 0,
      }"
    >
      <div
        v-for="(_value, index) in value.split('\n')"
        :key="index"
        class="mcsl-editor__line-num"
      >
        {{ index + 1 }}
      </div>
    </div>
    <div class="mcsl-editor__content">
      <textarea
        ref="editor"
        v-model="value"
        class="mcsl-editor__textarea"
        @input="refresh"
        @scroll="refresh"
        @click="refresh"
        @select="refresh"
        @keyup="refresh"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
        spellcheck="false"
      />
      <div ref="cursor" class="mcsl-editor__cursor" />
      <pre
        ref="cursorLocator"
        class="mcsl-editor__mirror mcsl-editor__locator"
      />
      <pre
        class="mcsl-editor__mirror"
        v-html="highlightText(shownText, 'typescript')"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-editor {
  display: flex;
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-main);
  overflow: hidden;
  align-items: stretch;

  & * {
    font-family: var(--mcsl-font-family-mono);
  }
}

.mcsl-editor__line-nums {
  z-index: 1;
  position: relative;
  top: var(--mcsl-editor__scroll-top);
  left: 0;
  height: var(--mcsl-editor__scroll-height);
  width: min-content;
  display: flex;
  flex-direction: column;
  padding: var(--mcsl-spacing-2xs);
  border-right: 1px solid var(--mcsl-border-color-base);
  background: var(--mcsl-bg-color-main);
  transition: box-shadow 0.2s ease-in-out;

  & > div {
    text-align: right;
    color: var(--mcsl-text-color-secondary);
  }
}

.mcsl-editor__line-nums-shadow {
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-editor__content {
  width: 0;
  height: 100%;
  flex-grow: 1;
  transform: translate(0);
}

.mcsl-editor__textarea,
.mcsl-editor__mirror {
  margin: 0;
  padding: var(--mcsl-spacing-2xs);
  outline: none;
  resize: none;
  border: none;
  background: transparent;
  text-wrap: nowrap;
}

.mcsl-editor__textarea {
  width: calc(100% - 2 * var(--mcsl-spacing-2xs));
  height: calc(100% - 2 * var(--mcsl-spacing-2xs));
  color: transparent;
  caret-color: transparent;
}

.mcsl-editor__mirror {
  position: absolute;
  pointer-events: none;
  width: var(--mcsl-editor__scroll-width);
  height: var(--mcsl-editor__scroll-height);
  top: var(--mcsl-editor__scroll-top);
  left: var(--mcsl-editor__scroll-left);
}

.mcsl-editor__locator {
  opacity: 0;
}

.mcsl-editor__cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 17px;
  background-color: var(--mcsl-color-primary);
  border-radius: var(--mcsl-border-radius-full);
  z-index: 1;
  pointer-events: none;
  transition: 0.1s ease-out;
  animation: blink 1s step-end infinite;
}
</style>
