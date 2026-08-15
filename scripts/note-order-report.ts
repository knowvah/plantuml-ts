#!/usr/bin/env node
/**
 * Note-order / uid invariant report — mission `note-leaf-model` T1
 * (`plans/note-leaf-model/batch-1/overview.md`).
 *
 * The standing gates see note ORDER only indirectly: `shape-match-report.ts`
 * scores primitives under best rigid alignment against jar (a note drawn in
 * the wrong document position still matches), the class DOT-parity gate
 * stops at the graph build (notes are already ordinary DOT nodes there,
 * `class/layout.ts` D5), and the svg-class/svg-object pins cover only a
 * subset of fixtures. This report is the direct gate for the three things
 * decision D5 says to watch across the restructure — DOCUMENT ORDER, UID
 * assignment and (via the whole-document hash) INK — on every class-engine
 * fixture, self-baselined against this port's own output rather than jar.
 *
 * Per class/object fixture under `test-results/dot-cache/`, renders `in.puml`
 * with a `DeterministicMeasurer` through `render-fixture-class.ts`
 * (`renderFixtureClass`, the same helper the oracle suites and
 * `shape-match-report.ts` use — object shares the class engine), then reads
 * BACK from the SVG in document order every `<g class="entity">` /
 * `<g class="link">` and labels each entity `note` or `cls` by whether its
 * `data-qualified-name` is one of the parse-side note ids (`ast.notes[].id`
 * — `__note_N` for an attached note, the declared alias for a freestanding
 * one). Reading the ORDER and UIDs back from the SVG, and the note identity
 * from the PARSE output, keeps the report independent of the post-layout
 * geometry model — which is exactly the thing the mission restructures.
 *
 * Only fixtures whose parse yields at least one note are listed (a note-less
 * fixture has nothing here to move); the TOTAL line counts both.
 *
 * Upstream's `LeafType.TIPS` leaf (`note <left|right> of Class::member`,
 * `CommandFactoryTipOnEntity`) draws UNWRAPPED — no `<g>`, no uid
 * (`EntityImageTips#drawU`; this port's `renderer-note.ts#renderTipNote`
 * mirrors that) — so a tip appears in the sequence only through the
 * document hash and the `tips=` count, never as a `note:` entry.
 *
 * Usage:
 *   npx tsx scripts/note-order-report.ts                 # print report
 *   npx tsx scripts/note-order-report.ts --check <file>  # diff against a
 *       saved report; prints every differing line, exits 1 on any difference
 *
 * Output (stable, diffable, name-sorted): one line per fixture,
 *   <type>/<slug> notes=<n> tips=<k> sha=<12 hex of the whole SVG> <seq>
 * where <seq> is a space-separated document-order list of
 *   cls:<qualified-name>=<uid> | note:<id>=<uid> | link=<uid>
 * (`-` when the element carries no id), or `<type>/<slug> ERR: <message>`
 * for a fixture that fails to render (never aborts the run), followed by
 *   TOTAL fixtures-with-notes: <n>/<all>
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import type { Node as XmlNode } from '@xmldom/xmldom';

import { buildBlockUmls } from '../src/core/BlockUmlBuilder.js';
import type { PreprocessOptions } from '../src/core/preprocessor.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import { parseClass } from '../src/diagrams/class/parser.js';
import { buildStdlibAssetsStore } from './stdlib-assets-store.js';
import { renderFixtureClass } from '../tests/oracle/svg-conformance/render-fixture-class.js';

const ELEMENT_NODE = 1;
const SHA_PREFIX_LEN = 12;

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
/** Class-engine fixture types only — object shares the class engine. */
const TYPES = ['class', 'object'] as const;

// ---------------------------------------------------------------------------
// Fixture discovery (mirrors scripts/shape-match-report.ts#listFixtureDirs)
// ---------------------------------------------------------------------------

interface FixtureDir { readonly slug: string; readonly type: string; readonly dir: string }

function listFixtureDirs(type: string): FixtureDir[] {
  const typeDir = join(CACHE_DIR, type);
  if (!existsSync(typeDir)) return [];
  const out: FixtureDir[] = [];
  for (const slug of readdirSync(typeDir)) {
    const dir = join(typeDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, '.done'))) continue;
    if (!existsSync(join(dir, 'in.puml'))) continue;
    out.push({ slug, type, dir });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parse-side note identity
// ---------------------------------------------------------------------------

let cachedStore: ReturnType<typeof withStdlib> | undefined;
function includeStore(): ReturnType<typeof withStdlib> {
  cachedStore ??= withStdlib({ get: () => undefined, has: () => false }, buildStdlibAssetsStore());
  return cachedStore;
}

interface NoteIdentity { readonly ids: ReadonlySet<string>; readonly tips: number }

/** The parse-side note ids and TIPS count for the FIRST diagram block —
 *  the same block `renderFixtureClass` renders (its own "page-1-only"
 *  contract; `parseClass` on the block's source, exactly as that helper
 *  does before it strips `.pages`). */
function noteIdentity(markup: string, options: PreprocessOptions): NoteIdentity {
  const first = buildBlockUmls(markup, options)[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;
  const preprocessed = first.preprocessed;
  const block = { ...first.source, rawStyles: preprocessed.styles, stylePositions: preprocessed.stylePositions };
  const ast = parseClass(block);
  return {
    ids: new Set(ast.notes.map((n) => n.id)),
    tips: ast.notes.filter((n) => n.targetPort !== undefined).length,
  };
}

// ---------------------------------------------------------------------------
// SVG document-order walk
// ---------------------------------------------------------------------------

/** Depth-first (= document order) list of every `<g class="entity|link">`
 *  as `kind:name=uid` tokens. */
function walkGroups(node: XmlNode, noteIds: ReadonlySet<string>, out: string[]): void {
  if (node.nodeType === ELEMENT_NODE) {
    const el = node as unknown as Element; // same narrowing as shape-match-report.ts
    if (el.tagName === 'g') {
      const cls = el.getAttribute('class');
      const uid = el.getAttribute('id') || '-';
      if (cls === 'link') out.push(`link=${uid}`);
      if (cls === 'entity') {
        const name = el.getAttribute('data-qualified-name') ?? '';
        out.push(`${noteIds.has(name) ? 'note' : 'cls'}:${name}=${uid}`);
      }
    }
  }
  for (let child = node.firstChild; child !== null; child = child.nextSibling) {
    walkGroups(child, noteIds, out);
  }
}

// ---------------------------------------------------------------------------
// Per-fixture line
// ---------------------------------------------------------------------------

interface FixtureLine { readonly label: string; readonly line: string; readonly hasNotes: boolean }

function reportFixture(f: FixtureDir): FixtureLine {
  const label = `${f.type}/${f.slug}`;
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const options: PreprocessOptions = { includeStore: includeStore() };
    const identity = noteIdentity(markup, options);
    if (identity.ids.size === 0) return { label, line: '', hasNotes: false };
    const svg = renderFixtureClass(markup, new DeterministicMeasurer(), options);
    const sha = createHash('sha1').update(svg).digest('hex').slice(0, SHA_PREFIX_LEN);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const seq: string[] = [];
    walkGroups(doc, identity.ids, seq);
    const line = `${label} notes=${identity.ids.size} tips=${identity.tips} sha=${sha} ${seq.join(' ')}`;
    return { label, line, hasNotes: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { label, line: `${label} ERR: ${message}`, hasNotes: true };
  }
}

function buildReport(): string[] {
  const fixtures = TYPES.flatMap((t) => listFixtureDirs(t)).sort((a, b) =>
    (a.type + '/' + a.slug).localeCompare(b.type + '/' + b.slug),
  );
  const lines: string[] = [];
  let withNotes = 0;
  for (const f of fixtures) {
    const r = reportFixture(f);
    if (!r.hasNotes) continue;
    withNotes++;
    lines.push(r.line);
  }
  lines.push(`TOTAL fixtures-with-notes: ${withNotes}/${fixtures.length}`);
  return lines;
}

// ---------------------------------------------------------------------------
// --check mode
// ---------------------------------------------------------------------------

function checkAgainst(baselinePath: string, current: readonly string[]): number {
  const baseline = readFileSync(baselinePath, 'utf-8').split('\n').filter((l: string) => l.length > 0);
  const byLabel = (lines: readonly string[]): Map<string, string> =>
    new Map(lines.map((l) => [l.split(' ')[0] ?? l, l]));
  const before = byLabel(baseline);
  const after = byLabel(current);
  let diffs = 0;
  for (const [label, line] of before) {
    const now = after.get(label);
    if (now === undefined) { console.log(`- ${line}`); diffs++; continue; }
    if (now !== line) { console.log(`- ${line}`); console.log(`+ ${now}`); diffs++; }
  }
  for (const [label, line] of after) {
    if (!before.has(label)) { console.log(`+ ${line}`); diffs++; }
  }
  console.log(diffs === 0 ? `note-order: identical to ${baselinePath}` : `note-order: ${diffs} fixture(s) differ from ${baselinePath}`);
  return diffs === 0 ? 0 : 1;
}

function main(): void {
  const args = process.argv.slice(2);
  const checkIdx = args.indexOf('--check');
  const lines = buildReport();
  if (checkIdx === -1) {
    for (const l of lines) console.log(l);
    return;
  }
  const baselinePath = args[checkIdx + 1];
  if (baselinePath === undefined) throw new Error('--check needs a baseline file path');
  process.exitCode = checkAgainst(baselinePath, lines);
}

main();
