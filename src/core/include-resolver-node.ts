import { readFile as fsReadFile, realpath as fsRealpath } from 'node:fs/promises';
import { resolve, normalize, sep } from 'node:path';
import type { IncludeFetcher } from './include-resolver.js';
import { IncludeResolveError } from './include-resolver.js';

/**
 * Signature of the readFile overload used by makeNodeFsFetcher.
 * Matches the node:fs/promises readFile(path, 'utf-8') overload.
 */
export type ReadFileFn = (path: string, encoding: 'utf-8') => Promise<string>;

/** Signature of node:fs/promises `realpath(path)`: every symlink resolved. */
export type RealpathFn = (path: string) => Promise<string>;

/** `candidate` is `base` itself or lies beneath it. */
function isInside(base: string, candidate: string): boolean {
  return candidate === base || candidate.startsWith(base.endsWith(sep) ? base : base + sep);
}

function escapeError(target: string, basePath: string): IncludeResolveError {
  return new IncludeResolveError(`!include path '${target}' escapes the base directory '${basePath}'`, target);
}

function readError(target: string, cause: unknown): IncludeResolveError {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new IncludeResolveError(`Failed to read !include '${target}': ${detail}`, target);
}

/**
 * Creates an IncludeFetcher that reads files from the local filesystem using
 * node:fs/promises. All resolved paths must remain within basePath to prevent
 * directory traversal attacks.
 *
 * Containment is checked twice: lexically (so `../x` and `/etc/passwd` are
 * refused without touching the disk), then on the REAL paths of both the
 * target and the base, so a symlink inside basePath that points outside it is
 * refused too. The file read is of the real path that passed the check.
 *
 * This module is intentionally separate from include-resolver.ts so that
 * browser bundles do not import node:fs (D4: treeshaking boundary).
 *
 * @param basePath    Absolute or relative base directory. All !include targets
 *                    are resolved relative to this directory.
 * @param readFileFn  Injectable readFile implementation (defaults to
 *                    node:fs/promises readFile). Override in tests.
 * @param realpathFn  Injectable realpath implementation (defaults to
 *                    node:fs/promises realpath). Override in tests.
 */
export function makeNodeFsFetcher(
  basePath: string,
  readFileFn: ReadFileFn = fsReadFile,
  realpathFn: RealpathFn = fsRealpath,
): IncludeFetcher {
  const resolvedBase = resolve(basePath);
  let realBase: Promise<string> | undefined;

  return async (target: string): Promise<string> => {
    const resolvedTarget = resolve(resolvedBase, normalize(target));

    // Path traversal protection: resolved target must be inside basePath.
    if (!isInside(resolvedBase, resolvedTarget)) throw escapeError(target, basePath);

    let realTarget: string;
    try {
      realBase ??= realpathFn(resolvedBase);
      [realTarget] = await Promise.all([realpathFn(resolvedTarget), realBase]);
    } catch (cause) {
      throw readError(target, cause);
    }
    if (!isInside(await realBase, realTarget)) throw escapeError(target, basePath);

    try {
      return await readFileFn(realTarget, 'utf-8');
    } catch (cause) {
      throw readError(target, cause);
    }
  };
}
