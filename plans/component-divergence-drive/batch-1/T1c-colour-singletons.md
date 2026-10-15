# T1c — colour singletons (fill/stroke precedence)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T1c`. Per D6, this task goes
straight to a fixer, but each row's mechanism must be stated before its edit.

## Rows (from `fixtures.md`; render-diff in `measurements/seed/rd/<slug>.txt`)
- **1–3 diffs:** cukafa-49-fona812, kagapo-72-cofe085, lobute-63-tizi096, somugi-21-doli483,
  suzemi-86-kuma659, gocexi-61-biso565, rapaji-98-xato067
- **4–10 diffs:** diduxa-76-zimu664, gafegu-06-nito976, kucabo-74-cora635, lovapo-83-xilo457,
  malado-53-noso561, zozutu-82-pupa220

## Task
1. For each row, read the `.puml` and the diffing element in the jar's `in.svg` against ours. Find
   the jar's colour source: skinparam, `<style>`, stereotype style, inline `#colour`, or theme.
   Quote the Java that resolves it (`style/`, `skin/SkinParam*.java`, `ISkinParam`, the
   `USymbol`/`EntityImage*` that applies it).
2. Group the rows by mechanism, and fix each mechanism once, at its origin.
3. Keep this precedence rule: the jar's resolution order is the spec. A rule that matches one row
   but contradicts another row's jar output is a wrong mechanism, not a special case.

## Write-set
- `src/diagrams/description/renderer-entity.ts`
- the description/core colour and stereotype resolution files where a stated mechanism lives
  (journal each; core falls under D5 with its guards)
- `tests/unit/description/**` and `tests/unit/core/**` for the touched modules
- **Excluded (D3):** `renderer-cluster.ts`, `layout.ts`, `layout-*.ts`. A mechanism there is
  re-slotted to T2/T4 and reported, never edited.

## Acceptance
- Given each of the 13 rows, when render-diffed after the fix, then its colour diffs are 0, or the
  residual is named with a mechanism.
- Given the component/usecase/class/object/state surveys in the worktree (`npm run -s svg:survey --
  <tree> --out <scratch>`), then there are zero conformant losses, and every verdict mover is
  listed with its mechanism.
- Given a core edit, then the D5 guards are green.

**Observability:** N/A. **Rollback:** Reversible.
