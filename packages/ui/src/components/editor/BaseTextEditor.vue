<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { highlightText } from "../../utils/render.ts";

defineProps<{
  lang?: string | string[];
}>();

const value = defineModel<string>({
  required: false,
  default: "",
});

const container = ref();
const editor = ref();
const caretLocator = ref();
const caret = ref();

const isComposing = ref(false);
const showCaret = ref(false);
const shownText = ref("");
const lineNumsShadow = ref(false);
const showFooterShadow = ref(false);

function refresh() {
  const text = editor.value.value;
  shownText.value = text;

  const scrollHeight = editor.value.scrollHeight;
  const offsetHeight = editor.value.offsetHeight;
  const scrollLeft = editor.value.scrollLeft;
  const scrollTop = editor.value.scrollTop;
  container.value.setAttribute(
    "style",
    `--mcsl-base-text-editor__scroll-width: ${editor.value.scrollWidth}px; ` +
      `--mcsl-base-text-editor__scroll-height: ${scrollHeight}px; ` +
      `--mcsl-base-text-editor__scroll-top: -${scrollTop}px; ` +
      `--mcsl-base-text-editor__scroll-left: -${scrollLeft}px;`,
  );

  showCaret.value = document.activeElement == editor.value;
  lineNumsShadow.value = scrollLeft > 0;
  showFooterShadow.value = scrollTop + offsetHeight < scrollHeight;

  // 计算光标的位置
  const selectionEnd = editor.value.selectionEnd;
  caretLocator.value.innerText = text.substring(0, selectionEnd);

  // 插入元素定位光标位置
  const cLocator = document.createElement("span");
  cLocator.textContent = "|";
  caretLocator.value.appendChild(cLocator);
  caret.value.style.transform = `translate(${cLocator.offsetLeft}px, ${cLocator.offsetTop}px)`;

  // 重置动画状态
  const lastAnim = caret.value.style.animation;
  caret.value.style.animation = "none";
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  caret.value.offsetHeight; // 触发重绘
  caret.value.style.animation = lastAnim;
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

defineExpose({
  showFooterShadow,
});
</script>

<template>
  <div class="mcsl-base-text-editor" ref="container">
    <div
      class="mcsl-base-text-editor__line-nums"
      :class="{
        'mcsl-base-text-editor__line-nums-shadow': lineNumsShadow,
      }"
    >
      <div
        v-for="(_value, index) in value.split('\n')"
        :key="index"
        class="mcsl-base-text-editor__line-num"
      >
        {{ index + 1 }}
      </div>
    </div>
    <div class="mcsl-base-text-editor__content">
      <textarea
        ref="editor"
        v-model="value"
        class="mcsl-base-text-editor__textarea"
        @input="refresh"
        @scroll="refresh"
        @click="refresh"
        @selectionchange="refresh"
        @keyup="refresh"
        @focus="refresh"
        @blur="refresh"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
        spellcheck="false"
      />
      <pre class="mcsl-base-text-editor__mirror">
          <span
              ref="caret"
              class="mcsl-base-text-editor__caret"
              :class="{
                'mcsl-base-text-editor__caret-visible': showCaret,
              }"
          />
        </pre>
      <pre
        ref="caretLocator"
        class="mcsl-base-text-editor__mirror mcsl-base-text-editor__locator"
      />
      <pre
        class="mcsl-base-text-editor__mirror"
        v-html="highlightText(shownText, lang)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-base-text-editor {
  display: flex;
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-main);
  overflow: hidden;

  & * {
    font-family: var(--mcsl-font-family-mono);
  }
}

.mcsl-base-text-editor__line-nums {
  z-index: 1;
  position: relative;
  top: var(--mcsl-base-text-editor__scroll-top);
  left: 0;
  height: var(--mcsl-base-text-editor__scroll-height);
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

.mcsl-base-text-editor__line-nums-shadow {
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-base-text-editor__content {
  width: 0;
  height: 100%;
  flex: 1;
  transform: translate(0);
}

.mcsl-base-text-editor__textarea,
.mcsl-base-text-editor__mirror {
  margin: 0;
  padding: var(--mcsl-spacing-2xs);
  outline: none;
  resize: none;
  border: none;
  background: transparent;
  text-wrap: nowrap;
}

.mcsl-base-text-editor__textarea {
  width: calc(100% - 2 * var(--mcsl-spacing-2xs));
  height: calc(100% - 2 * var(--mcsl-spacing-2xs));
  color: transparent;
  caret-color: transparent;
}

.mcsl-base-text-editor__mirror {
  position: absolute;
  pointer-events: none;
  width: var(--mcsl-base-text-editor__scroll-width);
  height: var(--mcsl-base-text-editor__scroll-height);
  top: var(--mcsl-base-text-editor__scroll-top);
  left: var(--mcsl-base-text-editor__scroll-left);
}

.mcsl-base-text-editor__locator {
  opacity: 0;
}

.mcsl-base-text-editor__caret {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 17px;
  opacity: 0;
  background-color: var(--mcsl-color-primary);
  border-radius: var(--mcsl-border-radius-full);
  z-index: 1;
  pointer-events: none;
  animation: none;
  transition: 0.1s ease-out;
}

.mcsl-base-text-editor__caret-visible {
  opacity: 1;
  animation: blink 1s 0.1s step-end infinite;
}
</style>
