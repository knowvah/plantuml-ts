/**
 * Which `LayoutServices` a render hands to `SyncPlugin.layoutSync` (cdd8 D2b).
 *
 * Upstream picks the ELK maker per diagram (`net/atmp/CucaDiagram.java:478-479`:
 * `isUseElk()` -> `CucaDiagramFileMakerElk`) and, without ELK on the
 * classpath, reports `InstallationRequirement.ELK_LIBRARY_REQUIRED`
 * (`CucaDiagram.java:950-952`). Here the plugin answers `requiresElk(ast)`;
 * `render()` then supplies `options.elk` or loads elkjs, and `renderSync`,
 * which cannot await the load, needs `options.elk`.
 */
import type { DiagramPlugin } from '../dispatcher.js';
import type { RenderOptions } from '../render-options.js';
import type { LayoutServices } from './elk-backend.js';
import { loadElk } from './load-elk.js';

/** Worded after `renderPagesSync`'s `!include` message (`src/index.ts`). */
export const ELK_RENDER_SYNC_UNSUPPORTED =
  '!pragma layout elk is not supported in renderSync without options.elk — ' +
  'use render(), or pass options.elk (await loadElk())';

function requiresElk(plugin: DiagramPlugin, ast: unknown): boolean {
  return 'layoutSync' in plugin && plugin.requiresElk?.(ast) === true;
}

/** `renderSync`'s services: the caller's backend, which an ELK diagram cannot do without. */
export function layoutServicesSync(plugin: DiagramPlugin, ast: unknown, options?: RenderOptions): LayoutServices {
  if (options?.elk === undefined && requiresElk(plugin, ast)) throw new Error(ELK_RENDER_SYNC_UNSUPPORTED);
  return { elk: options?.elk };
}

/** `render()`'s services: the caller's backend, else elkjs loaded only for a diagram that requires ELK. */
export async function layoutServices(
  plugin: DiagramPlugin,
  ast: unknown,
  options?: RenderOptions,
): Promise<LayoutServices> {
  if (options?.elk !== undefined || !requiresElk(plugin, ast)) return { elk: options?.elk };
  return { elk: await loadElk() };
}
