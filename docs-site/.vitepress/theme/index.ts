// SPDX-License-Identifier: GPL-3.0-or-later
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
// Brand: the Warm Studio palette as VitePress variables, the brand mono
// face self-hosted at the two weights the corporate site loads, and this
// site's own rules for where that face applies.
import '@knowvah/theme/vitepress';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './custom.css';
import Playground from './Playground.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Playground', Playground);
  },
} satisfies Theme;
