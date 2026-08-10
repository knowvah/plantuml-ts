/**
 * resolver-reachability guard — description engine.
 *
 * Named for what it measures, NOT "parity" (T5/ADR-3 amendment): it checks
 * whether a `resolveElement*` helper (`src/core/theme-element-resolve.ts`) is
 * REFERENCED from a description-engine sizer module as well as a renderer
 * module. It is a reachability check, not a use check, and it is a PARTIAL
 * guard — see the two sections below before trusting a green run.
 *
 * ## Why two glob sets, and why layout.ts is on the sizer side
 *
 * RENDERER-shaped files: `src/diagrams/description/renderer-*.ts` and
 * `src/core/svek/image/EntityImageDescription*.ts`.
 *
 * SIZER-shaped files: `src/diagrams/description/leaf-sizing*.ts` (the
 * `measureLeafNode` family) PLUS `layout.ts`. This is NOT the same as "every
 * BoxSizingOpts producer" — every `resolveElement*` sizer call site in
 * `planning/sizer-renderer-parity.md`'s table is `layout.ts:4xx`
 * (`ClassifyCtx.fontSizeFor` / `.minimumWidthFor`), because the resolver is
 * invoked while building `ClassifyCtx`, not inside `leaf-sizing.ts` itself
 * (which only reads the derived `BoxSizingOpts` field by name, never the
 * resolver). Restricting the sizer glob to `leaf-sizing*.ts` alone would
 * therefore misclassify `resolveElementFontSize` and
 * `resolveElementMinimumWidth` as reachability gaps despite being genuinely
 * threaded — a false positive from too-narrow a glob, not a true parity
 * defect. `layout.ts:473` (`fixCircleLabelOverlapping`, fed straight into
 * `runLayout` instead of `BoxSizingOpts`) is corroborating evidence that
 * `BoxSizingOpts` is not the sizer's only channel, which is why the glob is
 * keyed on "does the sizer's own construction code reference this name",
 * not on one specific struct.
 *
 * ## KNOWN LIMIT (ADR-3) — put in the failure message, not just here
 *
 * Of the FOUR historical sizer/renderer parity defects this mission's audit
 * catalogued, only ONE (per-element `FontSize`) was resolver-shaped.
 * `wrapWidth`, the creole-lexer divergence, and the use-case ellipse point
 * fit are all NON-resolver drifts (a plain `theme.wrapWidth` field read, a
 * shared-component lexer disagreement, and an algorithm divergence — no
 * `resolveElement*` call anywhere) and would all have sailed past this guard
 * GREEN. A green run here is not proof of parity — see the assertion message
 * in the first test below, which restates this so a 2am reader is not
 * misled by "the fitness function passed."
 *
 * ## Reachability is not use
 *
 * T4 proved this from the other direction: `BoxSizingOpts.inkSprites` was
 * assigned and never read anywhere, while the feature it was meant to carry
 * was already delivered through a different lookup
 * (`spriteDimsLookupFor` -> `inlineFootprintBox`). That is not a
 * `resolveElement*` case (no resolver function is involved -- it is a
 * plain struct field), so this guard's grep-based mechanism cannot detect
 * it either way, and more importantly: this guard's OWN "referenced in a
 * sizer module" check is a name-reference check, not a downstream-read
 * check. It cannot tell "the resolver's return value flows into the box
 * math" apart from "the resolver is called and its result is stored but
 * never actually consulted" -- that would need real dataflow analysis, not
 * a grep. A resolver could pass this guard (referenced on both sides) and
 * still have its sizer-side value be dead. Nothing in the current resolver
 * set is known to be in that state, but the guard cannot rule it out.
 *
 * ## What this guard is NOT and does not attempt
 *
 * - It does not check PER-SHAPE coverage. `wrapWidth`/`guillemet` reach
 *   `BoxSizingOpts` (the grep would be satisfied) yet are read by only ONE
 *   of seven leaf-sizing paths (`measureBox`) -- reachability is not
 *   per-caller use either.
 * - It does not cover other diagram engines. The class-family resolvers
 *   (`resolveElementBackground` etc., `src/diagrams/class/
 *   renderer-classifier-colors.ts`) are deliberately out of both globs --
 *   they belong to a different engine with its own sizer, not this one.
 * - It cannot forbid moving a KNOWN_GAPS entry into SIZE_NEUTRAL to quiet a
 *   failure -- that is a REVIEW discipline, not a runtime check. Do not do
 *   it: a `KNOWN_GAPS` entry means "this is a real defect, ledgered, and
 *   expected to fail until its own Batch-4 task lands", and relabelling it
 *   `size-neutral` would delete that record while leaving the code
 *   unfixed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const RESOLVER_SOURCE = join(ROOT, 'src/core/theme-element-resolve.ts');
const DESCRIPTION_DIR = join(ROOT, 'src/diagrams/description');
const SVEK_IMAGE_DIR = join(ROOT, 'src/core/svek/image');
const LEDGER_PATH = 'plans/s1l-leaf-sizing/ledger.md';

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Every `resolveElement*` identifier actually referenced (call, import, or
 *  any other code token) in the given files, with comments stripped first so
 *  a doc-comment MENTION of a resolver's name is never mistaken for a real
 *  reference (e.g. `leaf-sizing-consts.ts`'s doc comment names
 *  `resolveElementFontSize` even though no code in that file calls it). */
function resolverNamesReferencedIn(files: string[]): Set<string> {
  const found = new Set<string>();
  for (const file of files) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const m of code.matchAll(/\bresolveElement[A-Za-z]+\b/g)) {
      found.add(m[0]);
    }
  }
  return found;
}

function filesMatching(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir)
    .filter((f) => pattern.test(f))
    .map((f) => join(dir, f));
}

const RENDERER_FILES = [
  ...filesMatching(DESCRIPTION_DIR, /^renderer-.*\.ts$/),
  ...filesMatching(SVEK_IMAGE_DIR, /^EntityImageDescription.*\.ts$/),
];

const SIZER_FILES = [
  join(DESCRIPTION_DIR, 'layout.ts'),
  ...filesMatching(DESCRIPTION_DIR, /^leaf-sizing.*\.ts$/),
];

const ALL_RESOLVERS = [
  ...stripComments(readFileSync(RESOLVER_SOURCE, 'utf8')).matchAll(
    /export function (resolveElement[A-Za-z]+)/g,
  ),
].map((m) => m[1]!);

const rendererRefs = resolverNamesReferencedIn(RENDERER_FILES);
const sizerRefs = resolverNamesReferencedIn(SIZER_FILES);

/** Renderer-referenced, sizer-silent -- the reachability-gap shape. */
const gapShaped = [...rendererRefs].filter((n) => !sizerRefs.has(n)).sort();

/**
 * Genuinely cannot affect geometry. Each reason is copied VERBATIM from its
 * row in `planning/sizer-renderer-parity.md` (T5 amendment #1: seeded from
 * the table as it stands after T4, not from any earlier summary).
 */
const SIZE_NEUTRAL: Record<string, string> = {
  resolveElementPaint:
    'color only — returns a Paint consumed as an SVG fill/stroke; no caller ' +
    'multiplies it into a width or height, and it never enters ' +
    'calculateDimension. Fill and stroke COLOUR cannot move a DOT box; stroke ' +
    "WIDTH can, and that is resolveElementLineThickness's row, not this one. " +
    "(planning/sizer-renderer-parity.md, 'Per-element resolvers' table, row " +
    "'element BackgroundColor / LineColor / FontColor (Paint)')",
};

/**
 * This IS a real, ledgered gap, expected to fail until its Batch-4 task
 * lands. SHRINK-ONLY ratchet (like `size-backlog.json`): an entry whose gap
 * is fixed must be deleted in the SAME commit as the fix, and the
 * "KNOWN_GAPS entries are still real gaps" test below fails loudly if an
 * entry goes stale (i.e. the fix landed but nobody deleted the entry) --
 * that is the enforcement mechanism, since this file has no external pinned
 * state to compare against. Never move an entry here into SIZE_NEUTRAL to
 * quiet a failure -- that would relabel a known defect as a non-defect.
 */
const KNOWN_GAPS: Record<string, string> = {
  resolveElementShadowing:
    `${LEDGER_PATH} — "description-leaf-sizing-audit — carried findings ` +
    '(T4, 2026-07-28)", items 1 (per-element Shadowing) and 2 (diagram-wide ' +
    'Shadowing, same resolver\'s second tier, one Batch-4 fix covers both): ' +
    'actor { Shadowing 6 } 1.027778 -> 1.111111in, reaches ' +
    'renderer-entity.ts:212 / renderer-cluster.ts:119, no sizer reference.',
  // `resolveElementLineThickness` was item 3 here until S1L-tail F3-fix (G5)
  // threaded it: `layout.ts#ClassifyCtx.lineThicknessFor` ->
  // `BoxSizingOpts.lineThickness` -> `leaf-sizing-entity.ts#sizingPaint`'s
  // `UStroke.withThickness(...)`. Deleted in the SAME commit as the fix, as
  // this ratchet's own shrink-only rule requires. Verified on
  // `revusu-28-pexi248` (`<style> actor { LineThickness 4 }`): 55x76 ->
  // 62x83px, the jar's exact numbers.
};

describe('resolver-reachability guard (description engine)', () => {
  it('every resolveElement* reached from a renderer module is also reached from a sizer module, or is classified', () => {
    const unclassified = gapShaped.filter(
      (n) => !(n in SIZE_NEUTRAL) && !(n in KNOWN_GAPS),
    );
    expect(
      unclassified,
      [
        `resolver-reachability guard: ${unclassified.join(', ')} reaches a ` +
          'description renderer module and no description sizer module.',
        'This guard catches ONLY resolver-shaped divergences: of the four ' +
          'historical sizer/renderer parity defects, only ONE (per-element ' +
          'FontSize) was resolver-shaped -- wrapWidth, the creole lexer, and ' +
          'the use-case point fit would ALL have passed this check. Green here ' +
          'is not proof of parity.',
        'If this is a genuine new gap: add it to KNOWN_GAPS with a ' +
          `${LEDGER_PATH} pointer (Batch-4 territory -- do not fix it here). ` +
          'If it truly cannot affect geometry: add it to SIZE_NEUTRAL with the ' +
          'reason copied verbatim from planning/sizer-renderer-parity.md. ' +
          'NEVER move a KNOWN_GAPS entry into SIZE_NEUTRAL to quiet this ' +
          'failure -- that relabels a known defect as a non-defect.',
      ].join('\n'),
    ).toEqual([]);
  });

  it('every SIZE_NEUTRAL entry carries a written, non-placeholder reason', () => {
    for (const [name, reason] of Object.entries(SIZE_NEUTRAL)) {
      expect(reason.trim().length, `${name}: SIZE_NEUTRAL reason is empty`).toBeGreaterThan(20);
      expect(reason, `${name}: reason reads as an unfilled placeholder`).not.toMatch(
        /^(todo|tbd|n\/a|reason|fixme)$/i,
      );
    }
  });

  it('every KNOWN_GAPS entry cites the ledger', () => {
    for (const [name, note] of Object.entries(KNOWN_GAPS)) {
      expect(note.trim().length, `${name}: KNOWN_GAPS note is empty`).toBeGreaterThan(20);
      expect(note, `${name}: KNOWN_GAPS entry must cite ${LEDGER_PATH}`).toContain(LEDGER_PATH);
    }
  });

  it('no resolver is classified in both lists at once', () => {
    const overlap = Object.keys(SIZE_NEUTRAL).filter((n) => n in KNOWN_GAPS);
    expect(overlap, 'a resolver cannot be both size-neutral and a known gap').toEqual([]);
  });

  it('KNOWN_GAPS entries are still real gaps (delete stale entries in the fixing commit)', () => {
    const stale = Object.keys(KNOWN_GAPS).filter((n) => !gapShaped.includes(n));
    expect(
      stale,
      `${stale.join(', ')} is no longer reachability-gap-shaped -- its Batch-4 ` +
        'fix appears to have landed. Delete its KNOWN_GAPS entry in the SAME ' +
        'commit as the fix; do not leave a stale ratchet entry.',
    ).toEqual([]);
  });

  it('every classified resolver name is a real export of theme-element-resolve.ts', () => {
    for (const name of [...Object.keys(SIZE_NEUTRAL), ...Object.keys(KNOWN_GAPS)]) {
      expect(
        ALL_RESOLVERS,
        `${name} is not an exported resolveElement* from theme-element-resolve.ts ` +
          '-- fix the typo or remove the stale entry',
      ).toContain(name);
    }
  });
});

/**
 * Self-test of the extraction/classification mechanism, entirely in a temp
 * directory -- never touches `src/`. Proves the acceptance criterion "a
 * resolver added to theme-element-resolve.ts in future and wired only to
 * the renderer must fail this test" without mutating a tracked source file
 * (this task's write-set is this ONE test file; see its boundaries).
 */
describe('resolver-reachability guard mechanism (synthetic fixtures, no src/ writes)', () => {
  it('flags a resolver referenced only from a renderer-shaped file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolver-reachability-'));
    try {
      const rendererFile = join(dir, 'renderer-fake.ts');
      const sizerFile = join(dir, 'leaf-sizing-fake.ts');
      writeFileSync(
        rendererFile,
        "import { resolveElementFutureThing } from '../../core/theme.js';\n" +
          'resolveElementFutureThing(theme, sname);\n',
      );
      writeFileSync(sizerFile, '// this sizer module never references it\nconst x = 1;\n');

      const futureRendererRefs = resolverNamesReferencedIn([rendererFile]);
      const futureSizerRefs = resolverNamesReferencedIn([sizerFile]);
      const futureGap = [...futureRendererRefs].filter((n) => !futureSizerRefs.has(n));

      expect(futureGap).toEqual(['resolveElementFutureThing']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not flag a resolver referenced from both a renderer- and sizer-shaped file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolver-reachability-'));
    try {
      const rendererFile = join(dir, 'renderer-fake.ts');
      const sizerFile = join(dir, 'layout.ts');
      writeFileSync(rendererFile, 'resolveElementFutureThing(theme, sname);\n');
      writeFileSync(sizerFile, 'fontSizeFor: (sname) => resolveElementFutureThing(theme, sname),\n');

      const futureRendererRefs = resolverNamesReferencedIn([rendererFile]);
      const futureSizerRefs = resolverNamesReferencedIn([sizerFile]);
      const futureGap = [...futureRendererRefs].filter((n) => !futureSizerRefs.has(n));

      expect(futureGap).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores a resolver name that appears only in a doc comment, not in code', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolver-reachability-'));
    try {
      const rendererFile = join(dir, 'renderer-fake.ts');
      writeFileSync(
        rendererFile,
        '/** see resolveElementFutureThing for the cascade shape */\nconst x = 1;\n',
      );
      const refs = resolverNamesReferencedIn([rendererFile]);
      expect([...refs]).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
