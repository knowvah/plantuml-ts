import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      // vite-plugin-dts 5 re-bases onto `unplugin-dts` and renames
      // `rollupTypes` to `bundleTypes`. Same behaviour: roll the emitted
      // declarations up into one dist/<entry>.d.ts per library entry
      // (dist/plantuml-ts.d.ts for `types`, dist/image-providers.d.ts for the
      // `./image-providers` subpath).
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      // Two entries: the core, and the opt-in network/browser image providers
      // (decisions.md D3) so core consumers never load network code.
      entry: {
        'plantuml-ts': resolve(__dirname, 'src/index.ts'),
        'image-providers': resolve(__dirname, 'src/image-providers/index.ts'),
      },
      name: 'PlantUmlTs',
      // Entry keys are the output basenames, so the root stays `plantuml-ts.{js,cjs,d.ts}`.
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Runtime dependencies are imported, not inlined. `@knowvah/dot-engine`
      // is EPL-2.0 and this package is MIT: leaving it external means we
      // DEPEND on it rather than redistribute it inside our own artifact,
      // which is the distinction the licenses turn on. All of them are declared
      // in `dependencies`, so npm installs them for consumers either way; the
      // published bundle just stops carrying their code. `elkjs` (EPL-2.0 OR
      // GPL-3.0-or-later) is imported by subpath (`elkjs/lib/elk-worker.min.js`,
      // `src/core/elk/load-elk.ts`), so it is matched with its subpaths.
      // `@xmldom/xmldom` (MIT, plain JS) feeds the SAX sprite parser
      // (`src/core/klimt/sprite/sax/sax-events.ts`); it is imported, not inlined.
      external: ['katex', '@knowvah/dot-engine', 'jsonc-parser', 'pako', /^elkjs(\/|$)/, /^@xmldom\/xmldom(\/|$)/],
    },
    sourcemap: true,
  },
});
