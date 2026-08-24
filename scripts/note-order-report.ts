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
 * Every class/object fixture is listed, including note-less ones (printed
 * with `notes=0 tips=0` and its own sha + `cls:`/`link=` sequence) — mission
 * `leaf-draw-order` widened this so its `--check-order` gate can name
 * note-less movers too. The TOTAL line's numerator still counts only
 * note-carrying fixtures.
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
 *   npx tsx scripts/note-order-report.ts --vs-jar        # compare OUR
 *       entity/link uid sequence with jar's `in.svg` per fixture (every
 *       class/object fixture, note-carrying or not): prints
 *       `SAME` / `ORDER-ONLY` (same uid set, different order) / `OTHER`
 *       (different uid set) / `ERR` per fixture, then a tally. This is the
 *       gate for the `leaf-draw-order` mission
 *       (`plans/leaf-draw-order/decisions.md`, D6): jar draws nodes in
 *       `bibliotekon` insertion order -- packaged leaves first
 *       (`GraphvizImageBuilder#printGroups`), then unpackaged
 *       (`printEntities(getUnpackagedEntities())`), each in creation order,
 *       notes and TIPS included (`SvekResult#drawU`, `:82`) -- and this
 *       port's declaration-order + host-interleave (`renderer.ts`, G2 N52)
 *       is a proxy that holds on 65/97 note fixtures (2026-08-15).
 *   npx tsx scripts/note-order-report.ts --check-order <baseline-report>
 *       # re-render and compare every fixture in a saved default-mode
 *       report against the current one on `sha=`, `ink=` and the uid
 *       sequence (names stripped, `cls:Foo=ent0001` / `link=lnk1` -> the
 *       bare uid). `ink=` is the ORDER-INDEPENDENT hash of the SVG's
 *       top-level children (each child serialised, then sorted), so a
 *       fixture whose sha changed but whose ink did not is a PURE REORDER
 *       of siblings -- which is what "nothing but order moved" means, and
 *       it covers the leaves that draw UNWRAPPED (TIPS, collapsed-empty
 *       packages, assoc-circles: no `<g>`, no uid, invisible to the uid
 *       sequence -- mission leaf-draw-order T4's five false offenders).
 *       `MOVED <label>` when sha changed and ink did not (suffix
 *       `(unwrapped)` when the uid sequence did not move either);
 *       `OFFENDER <label> (...)` when sha and ink both changed, or the
 *       sequence changed without the sha; `MISSING`/`EXTRA <label>` for
 *       fixtures on only one side. Baselines without an `ink=` column fall
 *       back to the sha-vs-sequence rule. Final line `check-order:
 *       moved=<n> offenders=<m>`; exits 1 iff offenders > 0.
 *
 * Output (stable, diffable, name-sorted): one line per fixture,
 *   <type>/<slug> notes=<n> tips=<k> sha=<12 hex of the whole SVG> ink=<12 hex, see above> <seq>
 * where <seq> is a space-separated document-order list of
 *   cls:<qualified-name>=<uid> | note:<id>=<uid> | link=<uid>
 * (`-` when the element carries no id), or `<type>/<slug> ERR: <message>`
 * for a fixture that fails to render (never aborts the run), followed by
 *   TOTAL fixtures-with-notes: <n>/<all>
 */
import { astOrThrow } from '../tests/helpers/parse-ast.js';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import type { Node as XmlNode } from '@xmldom/xmldom';

import { buildBlockUmls } from '../src/core/BlockUmlBuilder.js';
import type { PreprocessOptions } from '../src/core/preprocessor.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { parseClass } from '../src/diagrams/class/parser.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
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
  const ast = astOrThrow(parseClass(block), 'class');
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

/** Order-independent hash of the SVG's DRAW-LEVEL siblings: every node
 *  under the root `<svg>` (elements AND the `<!--class ...-->` comments;
 *  whitespace-only text skipped) serialised, sorted, joined, sha1'd -- with
 *  the class-less top-level `<g font-family=...>` container (jar's root
 *  group, under which every entity/link/unwrapped shape sits) flattened
 *  one level: its own start tag as one token, each of its children as
 *  further tokens. Two renders with the same value differ AT MOST in the
 *  ORDER of their draw-level siblings. */
function inkHash(doc: XmlNode): string {
  const root = (doc as unknown as { documentElement: XmlNode }).documentElement;
  const parts: string[] = [];
  const pushChildren = (parent: XmlNode, flattenContainers: boolean): void => {
    for (let child = parent.firstChild; child !== null; child = child.nextSibling) {
      const el = child as unknown as Element;
      if (flattenContainers && child.nodeType === ELEMENT_NODE && el.tagName === 'g' && !el.hasAttribute('class')) {
        parts.push(`<g ${Array.from(el.attributes, (a) => `${a.name}="${a.value}"`).join(' ')}>`);
        pushChildren(child, false);
        continue;
      }
      const text = String(child);
      if (text.trim().length > 0) parts.push(text);
    }
  };
  pushChildren(root, true);
  parts.sort();
  return createHash('sha1').update(parts.join('\n')).digest('hex').slice(0, SHA_PREFIX_LEN);
}

// ---------------------------------------------------------------------------
// Per-fixture line
// ---------------------------------------------------------------------------

interface FixtureLine { readonly label: string; readonly line: string; readonly hasNotes: boolean }

function reportFixture(f: FixtureDir): FixtureLine {
  const label = `${f.type}/${f.slug}`;
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const options: PreprocessOptions = { includeStore: fixtureIncludeStore() };
    const identity = noteIdentity(markup, options);
    const svg = renderFixtureClass(markup, new DeterministicMeasurer(), options);
    const sha = createHash('sha1').update(svg).digest('hex').slice(0, SHA_PREFIX_LEN);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const seq: string[] = [];
    walkGroups(doc, identity.ids, seq);
    const line = `${label} notes=${identity.ids.size} tips=${identity.tips} sha=${sha} ink=${inkHash(doc)} ${seq.join(' ')}`;
    return { label, line, hasNotes: identity.ids.size > 0 };
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
    if (r.hasNotes) withNotes++;
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

// ---------------------------------------------------------------------------
// --vs-jar mode
// ---------------------------------------------------------------------------

/** Every `<g class="entity|link">` uid in document order -- the same walk
 *  as {@link walkGroups} minus the note/cls label, so OUR sequence and jar's
 *  (whose attached notes are named `GMNn`, unknown to us) compare on uids. */
function uidSequence(svg: string): string[] {
  const seq: string[] = [];
  walkGroups(new DOMParser().parseFromString(svg, 'image/svg+xml'), new Set(), seq);
  return seq.map((t) => t.replace(/^(cls|note):[^=]*=/, ''));
}

function compareWithJar(f: FixtureDir): 'SAME' | 'ORDER-ONLY' | 'OTHER' | 'ERR' {
  const jarPath = join(f.dir, 'in.svg');
  if (!existsSync(jarPath)) return 'ERR';
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const options: PreprocessOptions = { includeStore: fixtureIncludeStore() };
    const ours = uidSequence(renderFixtureClass(markup, new DeterministicMeasurer(), options));
    const jar = uidSequence(readFileSync(jarPath, 'utf-8'));
    if (ours.join(' ') === jar.join(' ')) return 'SAME';
    return [...ours].sort().join(' ') === [...jar].sort().join(' ') ? 'ORDER-ONLY' : 'OTHER';
  } catch {
    return 'ERR';
  }
}

function runVsJar(): void {
  const fixtures = TYPES.flatMap((t) => listFixtureDirs(t)).sort((a, b) =>
    (a.type + '/' + a.slug).localeCompare(b.type + '/' + b.slug),
  );
  const tally = { SAME: 0, 'ORDER-ONLY': 0, OTHER: 0, ERR: 0 };
  for (const f of fixtures) {
    const verdict = compareWithJar(f);
    tally[verdict]++;
    console.log(`${f.type}/${f.slug} ${verdict}`);
  }
  console.log(`TOTAL vs-jar: same=${tally.SAME} order-only=${tally['ORDER-ONLY']} other=${tally.OTHER} err=${tally.ERR}`);
}

// ---------------------------------------------------------------------------
// --check-order mode
// ---------------------------------------------------------------------------

/** `ink` is `undefined` for a report line captured before the `ink=` column
 *  existed (falls back to the sha-vs-sequence rule in {@link classify}). */
interface FixtureRecord { readonly sha: string; readonly ink: string | undefined; readonly seq: string }

/** `cls:Foo=ent0001` -> `ent0001`, `link=lnk1` -> `lnk1`: the same
 *  strip-to-uid idea as {@link uidSequence}, applied to a report LINE's
 *  tokens rather than a live SVG walk. */
function stripToUid(token: string): string {
  return token.replace(/^(cls|note):[^=]*=/, '').replace(/^link=/, '');
}

/** Parse one report line's `sha=` value and its uid-normalised sequence.
 *  `undefined` for an `... ERR: ...` line, which carries no `sha=` token. */
function parseFixtureRecord(line: string): FixtureRecord | undefined {
  const parts = line.split(' ');
  const shaIdx = parts.findIndex((p) => p.startsWith('sha='));
  if (shaIdx === -1) return undefined;
  const sha = parts[shaIdx]!.slice('sha='.length);
  const hasInk = parts[shaIdx + 1]?.startsWith('ink=') === true;
  const ink = hasInk ? parts[shaIdx + 1]!.slice('ink='.length) : undefined;
  const seq = parts.slice(shaIdx + (hasInk ? 2 : 1)).map(stripToUid).join(' ');
  return { sha, ink, seq };
}

function parseReport(lines: readonly string[]): Map<string, FixtureRecord> {
  const map = new Map<string, FixtureRecord>();
  for (const line of lines) {
    const label = line.split(' ')[0];
    if (label === undefined) continue;
    map.set(label, parseFixtureRecord(line) ?? { sha: line, ink: undefined, seq: '' });
  }
  return map;
}

type OrderVerdict = 'moved' | 'moved-unwrapped' | 'offender-sha' | 'offender-ink' | 'offender-order' | 'same';

/** With `ink=` on both sides: sha changed & ink unchanged = a pure reorder
 *  (MOVED, `-unwrapped` when even the uid sequence stayed put); sha & ink
 *  both changed = something other than order moved. Without `ink=` (an old
 *  baseline): the original sha-vs-sequence rule. */
function classify(before: FixtureRecord, after: FixtureRecord): OrderVerdict {
  const shaChanged = before.sha !== after.sha;
  const seqChanged = before.seq !== after.seq;
  if (!shaChanged) return seqChanged ? 'offender-order' : 'same';
  if (before.ink !== undefined && after.ink !== undefined) {
    if (before.ink !== after.ink) return 'offender-ink';
    return seqChanged ? 'moved' : 'moved-unwrapped';
  }
  return seqChanged ? 'moved' : 'offender-sha';
}

/** `[keyword, suffix]` per verdict; `same` prints nothing. */
const VERDICT_TEXT: Readonly<Record<OrderVerdict, readonly [string, string] | undefined>> = {
  moved: ['MOVED', ''],
  'moved-unwrapped': ['MOVED', ' (unwrapped)'],
  'offender-sha': ['OFFENDER', ' (sha changed, order did not)'],
  'offender-ink': ['OFFENDER', ' (sha and ink changed: not a pure reorder)'],
  'offender-order': ['OFFENDER', ' (order changed, sha did not)'],
  same: undefined,
};

function printVerdict(label: string, verdict: OrderVerdict): void {
  const text = VERDICT_TEXT[verdict];
  if (text !== undefined) console.log(`${text[0]} ${label}${text[1]}`);
}

function runCheckOrder(baselinePath: string): void {
  const baselineLines = readFileSync(baselinePath, 'utf-8')
    .split('\n')
    .filter((l: string) => l.length > 0 && !l.startsWith('TOTAL'));
  const currentLines = buildReport().filter((l) => !l.startsWith('TOTAL'));
  const before = parseReport(baselineLines);
  const after = parseReport(currentLines);
  let moved = 0;
  let offenders = 0;
  for (const [label, was] of before) {
    const now = after.get(label);
    if (now === undefined) { console.log(`MISSING ${label}`); continue; }
    const verdict = classify(was, now);
    printVerdict(label, verdict);
    if (verdict.startsWith('moved')) moved++;
    if (verdict.startsWith('offender')) offenders++;
  }
  for (const label of after.keys()) {
    if (!before.has(label)) console.log(`EXTRA ${label}`);
  }
  console.log(`check-order: moved=${moved} offenders=${offenders}`);
  process.exitCode = offenders > 0 ? 1 : 0;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--vs-jar')) {
    runVsJar();
    return;
  }
  const checkOrderIdx = args.indexOf('--check-order');
  if (checkOrderIdx !== -1) {
    const baselinePath = args[checkOrderIdx + 1];
    if (baselinePath === undefined) throw new Error('--check-order needs a baseline file path');
    runCheckOrder(baselinePath);
    return;
  }
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
