// @vitest-environment node
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncludeFetcher } from '../../src/core/include-resolver.js';
import { IncludeResolveError } from '../../src/core/include-resolver.js';
import { makeNodeFsFetcher } from '../../src/core/include-resolver-node.js';

// ---------------------------------------------------------------------------
// makeNodeFsFetcher accepts an injectable readFileFn so tests never touch
// the real filesystem. The second parameter defaults to node:fs/promises
// readFile in production — tests supply a vi.fn() instead.
// ---------------------------------------------------------------------------

const BASE = '/base/dir';

/** The mock-FS tests have no real `BASE` on disk: realpath is the identity there. */
const identityRealpath = (path: string): Promise<string> => Promise.resolve(path);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeNodeFsFetcher — return type', () => {
  it('returns a value that satisfies the IncludeFetcher type', () => {
    const fetcher: IncludeFetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    expect(typeof fetcher).toBe('function');
  });
});

describe('makeNodeFsFetcher — successful read', () => {
  it('reads a file within basePath and returns its content', async () => {
    const readFile = vi.fn().mockResolvedValue('skinparam monochrome true\n');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    const result = await fetcher('foo.puml');
    expect(result).toBe('skinparam monochrome true\n');
  });

  it('calls readFile with the resolved absolute path', async () => {
    const readFile = vi.fn().mockResolvedValue('');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    await fetcher('foo.puml');
    expect(readFile).toHaveBeenCalledWith(`${BASE}/foo.puml`, 'utf-8');
  });

  it('resolves relative paths correctly (subdir/file.puml)', async () => {
    const readFile = vi.fn().mockResolvedValue('content');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    await fetcher('subdir/file.puml');
    expect(readFile).toHaveBeenCalledWith(`${BASE}/subdir/file.puml`, 'utf-8');
  });

  it('normalises ./ prefixes before resolving', async () => {
    const readFile = vi.fn().mockResolvedValue('content');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    await fetcher('./common.puml');
    expect(readFile).toHaveBeenCalledWith(`${BASE}/common.puml`, 'utf-8');
  });
});

describe('makeNodeFsFetcher — path traversal protection', () => {
  it('throws IncludeResolveError for a single-level traversal (../secret)', async () => {
    const fetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    await expect(fetcher('../secret')).rejects.toBeInstanceOf(IncludeResolveError);
  });

  it('error message contains "escapes" for single-level traversal', async () => {
    const fetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    const err = (await fetcher('../secret').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err.message).toContain('escapes');
  });

  it('throws IncludeResolveError for a deep traversal (../../etc/passwd)', async () => {
    const fetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    await expect(fetcher('../../etc/passwd')).rejects.toBeInstanceOf(IncludeResolveError);
  });

  it('error message contains "escapes" for deep traversal', async () => {
    const fetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    const err = (await fetcher('../../etc/passwd').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err.message).toContain('escapes');
  });

  it('IncludeResolveError.url is the original target for traversal errors', async () => {
    const fetcher = makeNodeFsFetcher(BASE, vi.fn(), identityRealpath);
    const err = (await fetcher('../secret').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err.url).toBe('../secret');
  });

  it('does not throw for a path that stays within basePath', async () => {
    const readFile = vi.fn().mockResolvedValue('ok');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    await expect(fetcher('a/b/c.puml')).resolves.toBe('ok');
  });
});

describe('makeNodeFsFetcher — readFile ENOENT', () => {
  it('throws IncludeResolveError when readFile throws ENOENT', async () => {
    const enoent = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    const readFile = vi.fn().mockRejectedValue(enoent);
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    await expect(fetcher('missing.puml')).rejects.toBeInstanceOf(IncludeResolveError);
  });

  it('IncludeResolveError message includes the original error message on ENOENT', async () => {
    const enoent = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
    const readFile = vi.fn().mockRejectedValue(enoent);
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    const err = (await fetcher('missing.puml').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err.message).toContain('ENOENT');
  });

  it('IncludeResolveError.url is the original target on ENOENT', async () => {
    const enoent = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    const readFile = vi.fn().mockRejectedValue(enoent);
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    const err = (await fetcher('missing.puml').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err.url).toBe('missing.puml');
  });
});

describe('makeNodeFsFetcher — absolute targets', () => {
  it('rejects an absolute path outside basePath (/etc/passwd) without reading it', async () => {
    const readFile = vi.fn().mockResolvedValue('root:x:0:0');
    const fetcher = makeNodeFsFetcher(BASE, readFile, identityRealpath);
    const err = (await fetcher('/etc/passwd').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toBe("!include path '/etc/passwd' escapes the base directory '/base/dir'");
    expect(readFile).not.toHaveBeenCalled();
  });
});

// Real filesystem: symlinks are the one containment escape a lexical check
// cannot see, so these run against a temp dir (this module is Node-only).
describe('makeNodeFsFetcher — symlinks (real filesystem)', () => {
  let root = '';
  let base = '';

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'plantuml-ts-include-'));
    base = join(root, 'base');
    const outside = join(root, 'outside');
    await mkdir(base);
    await mkdir(outside);
    await mkdir(join(base, 'real'));
    await writeFile(join(outside, 'secret.puml'), 'SECRET');
    await writeFile(join(base, 'real', 'ok.puml'), 'INSIDE');
    await symlink(join(outside, 'secret.puml'), join(base, 'leak.puml'));
    await symlink(outside, join(base, 'leakdir'));
    await symlink(join(base, 'real', 'ok.puml'), join(base, 'alias.puml'));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('rejects a file symlink inside basePath that points outside it', async () => {
    const err = (await makeNodeFsFetcher(base)('leak.puml').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toBe(`!include path 'leak.puml' escapes the base directory '${base}'`);
  });

  it('rejects a path through a directory symlink that points outside basePath', async () => {
    const err = (await makeNodeFsFetcher(base)('leakdir/secret.puml').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toContain('escapes the base directory');
  });

  it('follows a symlink whose target stays inside basePath', async () => {
    await expect(makeNodeFsFetcher(base)('alias.puml')).resolves.toBe('INSIDE');
  });

  it('accepts a basePath that is itself reached through a symlink', async () => {
    const linkedBase = join(root, 'linked-base');
    await symlink(base, linkedBase);
    await expect(makeNodeFsFetcher(linkedBase)('real/ok.puml')).resolves.toBe('INSIDE');
  });

  it('a missing target is a read failure naming the target', async () => {
    const err = (await makeNodeFsFetcher(base)('nope.puml').catch((e: unknown) => e)) as IncludeResolveError;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.url).toBe('nope.puml');
    expect(err.message).toMatch(/^Failed to read !include 'nope\.puml': ENOENT/);
  });
});
