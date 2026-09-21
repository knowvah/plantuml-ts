<!-- SPDX-License-Identifier: MIT -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
// Aliased in .vitepress/config.ts to the real library source (src/index.ts,
// D2), so the playground always runs exactly what ships.
import { renderSync } from '@knowvah/plantuml-ts';
// Client-side PlantUML syntax highlighting, reusing the SAME grammar the docs
// code blocks use (single source of truth). Shiki runs in the browser here
// over a transparent-textarea overlay with its pure-JS regex engine (no
// WASM); the plain textarea still works if it fails to load (progressive
// enhancement). Ported from dot-atlassian's DOT playground.
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';
import { plantumlLang } from '../plantuml.tmLanguage';

const DEFAULT_SOURCE = `@startuml
class Animal {
  -name: String
  #age: int
  +makeSound(): void
}

class Dog extends Animal {
  +breed: String
  +fetch(): void
}

class Cat extends Animal {
  +indoor: boolean
  +scratch(): void
}

interface Pet {
  +play(): void
}

Dog ..|> Pet
Animal "1" -- "0..*" Toy : owns >

class Toy {
  +name: String
}
@enduml`;

const props = defineProps<{
  initial?: string;
  height?: string;
}>();

const source = ref(props.initial ?? DEFAULT_SOURCE);
const svg = ref('');
const error = ref('');

// --- syntax-highlight overlay ---
const highlighted = ref('');
const overlaid = ref(false); // true once the highlighter has painted a layer
const highlightEl = ref<HTMLElement | null>(null);
let highlighter: HighlighterCore | undefined;

function paintHighlight(): void {
  if (!highlighter) return;
  // Trailing newline keeps the highlight layer's height in step with the
  // textarea while the last line is being typed.
  highlighted.value = highlighter.codeToHtml(`${source.value}\n`, {
    lang: 'plantuml',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
  overlaid.value = true;
}

function syncScroll(e: Event): void {
  const ta = e.target as HTMLTextAreaElement;
  if (highlightEl.value) {
    highlightEl.value.scrollTop = ta.scrollTop;
    highlightEl.value.scrollLeft = ta.scrollLeft;
  }
}

function renderNow(): void {
  // Render is client-only — CanvasMeasurer needs the DOM <canvas> API, which
  // is unavailable during VitePress's Node-side SSR pass.
  if (typeof window === 'undefined') return;
  try {
    svg.value = renderSync(source.value);
    error.value = '';
  } catch (e) {
    // renderSync() catches its own parse/layout errors and returns an error
    // SVG rather than throwing, but this guards against any other
    // unexpected failure so the pane never goes blank or silent.
    svg.value = '';
    error.value = e instanceof Error ? e.message : String(e);
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleRender(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(renderNow, 250);
}

onMounted(async () => {
  renderNow();
  try {
    highlighter = await createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: [plantumlLang],
      // Pure-JS regex engine: the grammar is simple enough that the
      // JavaScript engine covers it fully, and it keeps the site free of
      // WASM (the Oniguruma engine ships a .wasm binary).
      engine: createJavaScriptRegexEngine(),
    });
    paintHighlight();
  } catch {
    // Highlighter unavailable — the plain (visible) textarea keeps working.
  }
});

watch(source, () => {
  paintHighlight();
  scheduleRender();
});
</script>

<template>
  <div class="pu-playground">
    <div class="pu-panes" :style="{ height: props.height ?? '480px' }">
      <div class="pu-editor">
        <div ref="highlightEl" class="pu-highlight" aria-hidden="true" v-html="highlighted"></div>
        <textarea
          v-model="source"
          class="pu-input"
          :class="{ overlaid }"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          aria-label="PlantUML source"
          @scroll="syncScroll"
        ></textarea>
      </div>
      <div class="pu-output" aria-label="Rendered SVG">
        <pre v-if="error" class="pu-error">{{ error }}</pre>
        <!-- Code review: playground v-html has no CSP; only self-XSS reachable today (no URL-reflection or share-link mechanism found). Revisit immediately if a share/permalink feature is added, or once the javascript: href fix lands. -->
        <div v-else class="pu-svg" v-html="svg"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pu-playground {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
}
.pu-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
/* Editor: a highlighted layer behind a transparent textarea. Both must share
   identical text metrics so the caret lines up with the painted glyphs. */
.pu-editor {
  position: relative;
  border-right: 1px solid var(--vp-c-divider);
  overflow: hidden;
  background: var(--vp-c-bg);
}
.pu-highlight,
.pu-input {
  margin: 0;
  padding: 0.75rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  line-height: 1.5;
  tab-size: 4;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
  border: none;
  box-sizing: border-box;
}
.pu-highlight {
  position: absolute;
  inset: 0;
  overflow: auto;
  pointer-events: none;
}
.pu-highlight :deep(pre.shiki) {
  margin: 0;
  padding: 0;
  background: transparent !important;
  font: inherit;
}
.pu-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  resize: none;
  outline: none;
  background: transparent;
  color: var(--vp-c-text-1); /* visible until the highlight layer paints */
  caret-color: var(--vp-c-text-1);
  overflow: auto;
}
.pu-input.overlaid {
  color: transparent; /* text is shown by the layer behind; keep the caret */
}
.pu-output {
  overflow: auto;
  padding: 0.75rem;
  background: #fff;
}
.pu-svg :deep(svg) {
  max-width: 100%;
  height: auto;
}
.pu-error {
  color: var(--vp-c-danger-1);
  white-space: pre-wrap;
  font-size: 0.8rem;
  margin: 0;
}
@media (max-width: 640px) {
  .pu-panes {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
    height: auto !important;
  }
}
</style>

<style>
/* UNSCOPED on purpose. defaultColor:false emits token colors as
   --shiki-light/--shiki-dark CSS variables, not a `color`; these rules map
   them to the live color, switching on VitePress's html.dark. They cannot
   live in the scoped block: Vue does not support :global() as an ancestor
   combinator, so a scoped `html.dark …` rule never matches and dark mode
   would paint the light palette onto the dark background. */
.pu-playground .pu-highlight .shiki,
.pu-playground .pu-highlight .shiki span {
  color: var(--shiki-light);
}
html.dark .pu-playground .pu-highlight .shiki,
html.dark .pu-playground .pu-highlight .shiki span {
  color: var(--shiki-dark);
}
</style>
