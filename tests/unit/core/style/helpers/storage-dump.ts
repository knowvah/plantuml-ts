/**
 * Reads a port `StyleBuilder`'s storage back into the jar dump shape, and
 * expands the compact `../fixtures/style-parser-storage.json` cases into
 * the full storage the jar dumped.
 *
 * Every case was dumped from the 1.2026.8beta1 oracle jar with the T2a
 * probe: `plans/mindmap-engine-port/tools/probe/run-probe.sh DumpProbe dump
 * <case>.puml` (the final `MindMapDiagram.getCurrentStyleBuilder()`'s
 * `StyleStorage.getStyles()`, in iteration order). `corpus-<slug>` cases are
 * `test-results/dot-cache/mindmap/<slug>/in.puml` verbatim (every corpus
 * mindmap with a `<style>` block and no skinparam/`!theme`/`skin` line);
 * `authored-*` cases were written for parser branches the corpus lacks.
 *
 * Storage is `legacy` (stereotyped styles) then `plain`
 * (StyleStorage.java:88-100). A case is stored either `full`, or as its
 * `legacy` styles plus the `plain` styles that differ, by index, from
 * `plantuml-skin-storage.json` (the dump of `plantuml.skin` alone).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { StyleBuilder } from '../../../../../src/core/style/StyleBuilder.js';
import type { StyleStorage } from '../../../../../src/core/style/StyleStorage.js';
import { dumpStyle, skinStorageDump, type DumpedStyle } from './style-fixture.js';

interface FullCase {
  readonly source: string;
  readonly full: readonly DumpedStyle[];
}

interface DeltaCase {
  readonly source: string;
  readonly legacy: readonly DumpedStyle[];
  readonly plainLength: number;
  readonly plainChanged: Readonly<Record<string, DumpedStyle>>;
}

type StorageCase = FullCase | DeltaCase;

export interface JarStorageCase {
  readonly name: string;
  readonly source: string;
  readonly storage: readonly DumpedStyle[];
}

function expand(c: StorageCase): readonly DumpedStyle[] {
  if ('full' in c) return c.full;
  const base = skinStorageDump();
  const plain: DumpedStyle[] = [];
  for (let i = 0; i < c.plainLength; i++) {
    const style = c.plainChanged[String(i)] ?? base[i];
    if (style === undefined) throw new Error(`case plain[${i}] has no base style`);
    plain.push(style);
  }
  return [...c.legacy, ...plain];
}

/** Every jar-dumped case, expanded. */
export function jarStorageCases(): readonly JarStorageCase[] {
  const url = new URL('../fixtures/style-parser-storage.json', import.meta.url);
  const raw = JSON.parse(readFileSync(fileURLToPath(url), 'utf8')) as Record<string, StorageCase>;
  return Object.entries(raw).map(([name, c]) => ({ name, source: c.source, storage: expand(c) }));
}

/** The builder's private `storage` (StyleBuilder.java:49), dumped in iteration order. */
export function dumpStorage(builder: StyleBuilder): readonly DumpedStyle[] {
  const storage = (builder as unknown as { readonly storage: StyleStorage }).storage;
  return storage.getStyles().map(dumpStyle);
}
