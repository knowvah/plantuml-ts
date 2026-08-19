#!/usr/bin/env node
/**
 * Generates `docs/catalog.md` — the module + public-API index that
 * `CLAUDE.md` tells every agent to check "before implementing anything,
 * agents routinely rebuild what exists".
 *
 * **Why this is generated and gated, not hand-written.** The rule used to
 * point at `.claude/catalog.md`, which did not exist and could never have
 * been committed (`.claude/` is gitignored) — a rule pointing at a
 * nonexistent file, which is the stale-premise failure this repo keeps
 * paying for. A hand-written catalog of ~1000 modules would go stale within
 * a week and become the same trap with more words. So it is derived from the
 * source, and `tests/architecture/catalog.test.ts` fails if it drifts.
 *
 * **What it deliberately is NOT.** Not a flat list of every exported symbol
 * (~2900 of them) — that is what `grep` and Serena's `find_symbol` are for,
 * and they are better at it. This answers the question those tools answer
 * badly: *does a module for X already exist?* One line per module, its
 * exported surface named, grouped by directory. SI31's T5 is the worked
 * example: the faithful `simulateCompound` port already existed under
 * `src/diagrams/description/`, and copying it instead of moving it was
 * explicitly forbidden — you can only obey that rule if you can find it.
 *
 * Export detection uses the TypeScript parser, not regex: `export { a, b }`,
 * `export * from`, `export type`, and overloads all have to be read
 * correctly, and a catalog that lies is worse than none.
 *
 * Usage:
 *   npx jiti scripts/generate-catalog.ts            write docs/catalog.md
 *   npx jiti scripts/generate-catalog.ts --check    exit 1 if it would change
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(REPO, 'src');
const OUT = join(REPO, 'docs', 'catalog.md');

/** Files that carry no public surface worth indexing. */
const SKIP = /\.(test|spec|d)\.ts$/;

interface ModuleEntry {
  /** Path relative to `src/`, POSIX separators. */
  path: string;
  /** Exported symbol names, source order, de-duplicated. */
  exports: string[];
  /** First sentence of the file's leading block comment, if any. */
  summary: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !SKIP.test(name)) out.push(full);
  }
  return out;
}

/**
 * Names introduced by one exported statement. Mirrors the shapes this repo
 * actually uses; anything unrecognised contributes nothing rather than
 * guessing a name.
 */
function namesOf(node: ts.Statement): string[] {
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
    return node.name ? [node.name.text] : ['default'];
  }
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
    return [node.name.text];
  }
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations
      .map((d) => (ts.isIdentifier(d.name) ? d.name.text : ''))
      .filter(Boolean);
  }
  return [];
}

function hasExportModifier(node: ts.Statement): boolean {
  return (ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : []).some(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );
}

function leadingSummary(text: string, node: ts.Node, file: ts.SourceFile): string {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  const block = ranges.find((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia);
  if (block === undefined) return '';
  const body = text
    .slice(block.pos, block.end)
    .replace(/^\/\*+/, '')
    .replace(/\*+\/$/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*ic?\s?/, '').replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
  // First sentence, collapsed. Markdown emphasis and links survive as-is.
  const sentence = /^(.*?[.!?])(\s|$)/.exec(body)?.[1] ?? body;
  void file;
  return sentence.replace(/\s+/g, ' ').slice(0, 240).trim();
}

function readModule(absPath: string): ModuleEntry {
  const text = readFileSync(absPath, 'utf8');
  const file = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true);
  const exports: string[] = [];
  // ONLY the file's own header block, i.e. the comment attached to its first
  // statement. Scanning on for the first statement that happens to carry one
  // attributes some unrelated symbol's docblock to the module (`src/index.ts`
  // acquired a sentence about preprocessed block interiors that way) — and a
  // catalog that misdescribes a module is worse than one that says nothing.
  const summary = file.statements.length > 0 ? leadingSummary(text, file.statements[0]!, file) : '';

  for (const st of file.statements) {
    if (ts.isExportDeclaration(st)) {
      if (st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) exports.push(el.name.text);
      } else if (st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
        exports.push(`* from ${st.moduleSpecifier.text}`);
      }
      continue;
    }
    if (hasExportModifier(st)) exports.push(...namesOf(st));
  }

  return {
    path: relative(SRC, absPath).split(sep).join('/'),
    exports: [...new Set(exports)],
    summary,
  };
}

function groupByDir(entries: ModuleEntry[]): Map<string, ModuleEntry[]> {
  const byDir = new Map<string, ModuleEntry[]>();
  for (const e of entries) {
    const dir = e.path.includes('/') ? e.path.slice(0, e.path.lastIndexOf('/')) : '.';
    const bucket = byDir.get(dir);
    if (bucket === undefined) byDir.set(dir, [e]);
    else bucket.push(e);
  }
  return byDir;
}

function header(moduleCount: number, exportCount: number): string[] {
  return [
    '# Module catalog',
    '',
    '**Generated — do not edit by hand.** Regenerate with `npm run catalog`;',
    '`tests/architecture/catalog.test.ts` fails if this file drifts from `src/`.',
    '',
    'This is the index `CLAUDE.md` means by "**Check before implementing',
    'anything**; agents routinely rebuild what exists". It answers *does a',
    'module for X already exist?* — one row per module, its exported surface',
    'named. For *where is symbol Y defined*, use Serena\'s `find_symbol` or',
    '`ast-grep`, which are better at it than any document.',
    '',
    `${moduleCount} modules · ${exportCount} exported names.`,
    '',
  ];
}

function section(dir: string, mods: ModuleEntry[]): string[] {
  const lines = [`## \`src/${dir === '.' ? '' : dir + '/'}\``, '', '| Module | Exports | Purpose |', '|---|---|---|'];
  for (const e of [...mods].sort((a, b) => a.path.localeCompare(b.path))) {
    const base = e.path.slice(e.path.lastIndexOf('/') + 1);
    const surface = e.exports.length ? e.exports.map((n) => `\`${n}\``).join(', ') : '_(none)_';
    lines.push(`| \`${base}\` | ${surface} | ${e.summary.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  return lines;
}

function render(entries: ModuleEntry[]): string {
  const byDir = groupByDir(entries);
  const total = entries.reduce((n, e) => n + e.exports.length, 0);
  const lines = header(entries.length, total);
  for (const dir of [...byDir.keys()].sort()) lines.push(...section(dir, byDir.get(dir)!));
  return lines.join('\n');
}

/**
 * The catalog's full text for the current `src/` tree. Exported so
 * `tests/architecture/catalog.test.ts` can compare against the committed file
 * without shelling out — and so importing this module has NO side effect
 * (writing `docs/catalog.md` from inside a test run would defeat the gate).
 */
export function buildCatalog(): string {
  return render(walk(SRC).map(readModule));
}

export const CATALOG_PATH = OUT;

function main(): void {
  const body = buildCatalog();
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(OUT, 'utf8');
    } catch {
      current = '';
    }
    if (current !== body) {
      console.error('docs/catalog.md is out of date — run `npm run catalog`.');
      process.exit(1);
    }
    console.log('docs/catalog.md is up to date.');
    return;
  }
  writeFileSync(OUT, body);
  console.log('[catalog] wrote docs/catalog.md');
}

// CLI only. Importing this module (the drift test does) must have no side
// effect, or the test would rewrite the very file it is checking.
if (process.argv[1]?.endsWith('generate-catalog.ts') === true) main();
