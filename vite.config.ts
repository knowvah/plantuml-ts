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
      external: ['katex'],
    },
    sourcemap: true,
  },
});
