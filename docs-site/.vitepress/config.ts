// SPDX-License-Identifier: MIT
import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { plantumlLang } from './plantuml.tmLanguage';

// VitePress treats any resolved module id matching /\.data\.m?(j|t)s($|\?)/
// as a build-time "data loader" (see vitepress/dist/node's staticDataPlugin)
// and tries to execute it as a `{ load(): ... }` config file. The library's
// generated font-metrics tables (src/core/measurer-jar.data.ts,
// src/core/measurer-width-table.data.ts — see scripts/extract-jar-font-metrics)
// happen to match that unrelated naming convention, and renderSync's static
// import chain pulls both in unconditionally. Renaming those files is out of
// this task's write-set (T5 owns docs-site/.vitepress only), so this plugin
// resolves the two colliding specifiers to a non-matching virtual id and
// serves the real file's source verbatim, sidestepping VitePress's plugin
// entirely without forking or duplicating the generated data.
const DATA_FILE_RE = /measurer-(jar|width-table)\.data\.[jt]s$/;
// A `\0`-prefixed truly-virtual id would dodge VitePress's regex, but Vite's
// own esbuild TS-transform plugin skips `\0`-prefixed ids by convention
// (they're assumed to already be plain JS), leaving the returned TS syntax
// unparsed. Renaming the `.data.ts` suffix keeps the id a normal-looking,
// non-virtual `.ts` path — picked up by the TS transform, invisible to
// VitePress's `\.data\.m?(j|t)s` matcher.
const MARKER_SUFFIX = '.__data_shim__.ts';

function libraryDataFileShim(): Plugin {
  return {
    name: 'plantuml-ts-data-file-shim',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !DATA_FILE_RE.test(source)) return null;
      const real = resolvePath(dirname(importer), source.replace(/\.js$/, '.ts'));
      return real.replace(/\.data\.ts$/, MARKER_SUFFIX);
    },
    load(id) {
      if (!id.endsWith(MARKER_SUFFIX)) return null;
      const real = id.slice(0, -MARKER_SUFFIX.length) + '.data.ts';
      return readFileSync(real, 'utf-8');
    },
  };
}

// Published at https://plantuml.knowvah.com by .github/workflows/docs.yml.
// docs-site/public/CNAME is what tells GitHub Pages to serve that host.
export default defineConfig({
  // Served from the root of its own subdomain, so no path prefix. This is
  // what would break first if the site ever moved back to a subdirectory:
  // the page would still load and every stylesheet would 404.
  base: '/',
  title: 'plantuml-ts',
  description: 'PlantUML in pure TypeScript — no Java, no server, browser-native. ' + 'PlantUML source in, SVG out.',
  lang: 'en-US',
  cleanUrls: true,
  markdown: {
    // Shiki bundles no PlantUML grammar, so without this it warns and falls
    // back to plain text. Registered here and reused by the playground's
    // client-side highlighter, so both come from one grammar.
    languages: [plantumlLang],
  },
  head: [
    // The mark comes from @knowvah/theme, copied into docs-site/public/ by
    // `npm run docs:brand` (docs-site/copy-brand-assets.mjs).
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/knowvah_logo.svg' }],
    ['meta', { name: 'theme-color', content: '#c45d3e' }],
    // The social card is the corporate site's existing PlantUML banner,
    // referenced where it already lives rather than committed here.
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'plantuml-ts' }],
    ['meta', { property: 'og:image', content: 'https://knowvah.com/images/og-plantuml.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  themeConfig: {
    // Nav-bar mark, beside the site title.
    logo: '/knowvah_logo.svg',
    // Built-in offline search (MiniSearch); no external service.
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Playground', link: '/playground' },
      { text: 'API', link: '/guide/api' },
      { text: 'Parity', link: '/parity' },
      { text: 'Divergences', link: '/divergences' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'API reference', link: '/guide/api' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Playground', link: '/playground' },
          { text: 'Parity dashboard', link: '/parity' },
          { text: 'Known divergences', link: '/divergences' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/knowvah/plantuml-ts' }],
  },
  vite: {
    plugins: [libraryDataFileShim()],
    resolve: {
      alias: {
        // The playground imports the *real* engine source (D2), so docs
        // stay in lockstep with the library rather than a copied bundle.
        '@knowvah/plantuml-ts': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
  },
});
