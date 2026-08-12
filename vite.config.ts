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
      // declarations up into the single dist/plantuml-ts.d.ts that
      // package.json's `types` points at.
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PlantUmlTs',
      fileName: 'plantuml-ts',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Runtime dependencies are imported, not inlined. `@knowvah/dot-engine`
      // is EPL-2.0 and this package is MIT: leaving it external means we
      // DEPEND on it rather than redistribute it inside our own artifact,
      // which is the distinction the licenses turn on. All three are declared
      // in `dependencies`, so npm installs them for consumers either way; the
      // published bundle just stops carrying their code.
      external: ['katex', '@knowvah/dot-engine', 'jsonc-parser'],
    },
    sourcemap: true,
  },
});
