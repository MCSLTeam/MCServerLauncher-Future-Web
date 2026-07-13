<script setup lang="ts">
import { computed } from "vue";

type HighlightResult = {
  value: string;
};

type CodeHighlighter = {
  highlight: (
    code: string,
    options: { language: string; ignoreIllegals?: boolean },
  ) => HighlightResult;
  highlightAuto?: (code: string, languageSubset?: string[]) => HighlightResult;
  getLanguage?: (language: string) => unknown;
};

const props = withDefaults(
  defineProps<{
    code?: string;
    language?: string;
    hljs?: CodeHighlighter;
    lineNumbers?: boolean;
    maxHeight?: string;
  }>(),
  {
    code: "",
    language: "plaintext",
    hljs: undefined,
    lineNumbers: false,
    maxHeight: "32rem",
  },
);

const codeStyle = computed(() => ({
  "--mcsl-code-max-height": props.maxHeight,
}));

const languageClass = computed(
  () => `language-${props.language || "plaintext"}`,
);

const highlightedCode = computed(() => {
  const highlighter = props.hljs;
  const language = props.language;

  if (!highlighter) return escapeHtml(props.code);

  try {
    if (language && highlighter.getLanguage?.(language)) {
      return highlighter.highlight(props.code, {
        language,
        ignoreIllegals: true,
      }).value;
    }

    return (
      highlighter.highlightAuto?.(props.code).value ?? escapeHtml(props.code)
    );
  } catch {
    return escapeHtml(props.code);
  }
});

const highlightedLines = computed(() => highlightedCode.value.split(/\n/));

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
</script>

<template>
  <div class="mcsl-code" :style="codeStyle">
    <pre class="mcsl-code__pre"><code
      v-if="lineNumbers"
      class="mcsl-code__code hljs"
      :class="languageClass"
    ><span
      v-for="(line, index) in highlightedLines"
      :key="index"
      class="mcsl-code__line"
    ><span class="mcsl-code__gutter">{{ index + 1 }}</span><span
      class="mcsl-code__content"
      v-html="line || '&nbsp;'"
    /></span></code><code
      v-else
      class="mcsl-code__code hljs"
      :class="languageClass"
      v-html="highlightedCode"
    /></pre>
  </div>
</template>

<style scoped lang="scss">
.mcsl-code {
  min-width: 0;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 76%, transparent);
}

.mcsl-code__pre {
  max-height: var(--mcsl-code-max-height);
  margin: 0;
  overflow: auto;
}

.mcsl-code__code {
  display: block;
  min-width: max-content;
  padding: 14px 16px;
  color: var(--mcsl-text-color-regular);
  font-family: var(--mcsl-font-family-mono);
  font-size: var(--mcsl-font-size-sm);
  line-height: 1.65;
  tab-size: 2;
  background: transparent;
}

.mcsl-code__line {
  display: grid;
  grid-template-columns: 3.2em minmax(0, 1fr);
  min-height: 1.65em;
}

.mcsl-code__gutter {
  padding-right: 14px;
  color: var(--mcsl-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
}

.mcsl-code__content {
  min-width: 0;
}

:deep(.hljs-keyword),
:deep(.hljs-operator) {
  color: var(--mcsl-color-rose-dark);
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: var(--mcsl-text-color-secondary);
  font-style: italic;
}

:deep(.hljs-string),
:deep(.hljs-regexp),
:deep(.hljs-addition),
:deep(.hljs-attribute),
:deep(.hljs-meta .hljs-string) {
  color: var(--mcsl-color-lime-darker);
}

:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-name),
:deep(.hljs-selector-tag),
:deep(.hljs-deletion),
:deep(.hljs-subst) {
  color: var(--mcsl-color-rose);
}

:deep(.hljs-built_in),
:deep(.hljs-title.class_),
:deep(.hljs-class .hljs-title) {
  color: var(--mcsl-color-amber-dark);
}

:deep(.hljs-attr),
:deep(.hljs-variable),
:deep(.hljs-template-variable),
:deep(.hljs-type),
:deep(.hljs-selector-class),
:deep(.hljs-selector-attr),
:deep(.hljs-selector-pseudo),
:deep(.hljs-number) {
  color: var(--mcsl-color-amber);
}

:deep(.hljs-literal) {
  color: var(--mcsl-color-teal);
}

:deep(.hljs-symbol),
:deep(.hljs-bullet),
:deep(.hljs-link),
:deep(.hljs-meta),
:deep(.hljs-selector-id) {
  color: var(--mcsl-color-sky);
}
</style>
