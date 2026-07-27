# Architecture decisions — S1L-b-unicode (locked)

Confirmed 2026-07-27. The upstream rules below were **resolved during planning**
(source + jar-oracle evidence), not left as open questions. Treat as fixed; if a
conflicting constraint appears, STOP and log to `decision-journal.md`.

## Resolved upstream rules (the evidence)

**Rule 1 — line-splitting vs codepoint decoding (HIGH confidence).**
`Display.getWithNewlines` (`klimt/creole/Display.java`) splits a display into
lines ONLY on backslash `\n`/`\r`/`\l` and `%newline()`/`%n()`. `<U+XXXX>` and
`&#NNN;` are NOT split points — they are decoded later, per text atom, at
render/measure time (`klimt/creole/legacy/AtomText.java#manageSpecialChars`,
`Character.toChars(codePoint)`). So a decoded `<U+000A>` is an **inline** control
char within its line, never a line break. Confirmed by the oracle: gafico node
`a` (4× `<U+000A>`, 0× `\n`) is ONE line; nujito has a 4-line node from 3× `\n`.

**Rule 2 — quoted `"…"` title is rendered LITERALLY (behavior confirmed,
mechanism NOT).** The jar-rendered oracle SVG for gafico shows node `a`
(`node "$var" as a`) as a single literal `<text>` = the full 77-char raw string
(`aaa <U+000A> bbb <U+000A> <u:blue>ccc …`), tags and `<U+…>` verbatim, one line
(7.857in). No creole, no decode. **Generalizing "quoted titles are literal" is
dangerous** — normally `component "<b>x</b>"` renders bold. This looks specific
to the `!$var` preprocessor-variable-in-quotes case. The exact trigger is T2's
job to pin, with regression guards.

## ADR-1 — Codepoint escapes decode per-line, after the split

**Decision:** `finalizeDisplay` (`parse-helpers-strings.ts`) stops calling
`resolveTextEscapes` (it currently decodes BEFORE the split, so `<U+000A>`→`\n`
→ over-splits). Instead a shared per-line helper decodes `<U+…>`/`&#…;` inside
the sizer's and renderer's per-line loops, so a decoded newline-codepoint is
inline. `\n`/`\r`/`\l` still split via `resolveNewlineEscapes`.

**Consequences:** Matches upstream (`manageSpecialChars` is per-atom).
Output-neutral for every display WITHOUT a newline-codepoint (a non-newline
codepoint like `<U+221E>`∞ decodes to the same char in the same line either
way). Sizer and renderer MUST decode identically (the sizer↔renderer sync
invariant — same class as the HR-classification sync in S1L-b-display). If the
fix seems to need editing the shared `resolveTextEscapes` in `core/`, that is
the signal it is scoped wrong — STOP.

## ADR-2 — Quoted-title literalness: scoped fix or documented residual

**Decision:** T2 investigates the exact trigger (probe `component "<b>x</b>"`
vs `node "$var"` with a preprocessor var; read the upstream title-display path)
and either implements the verified-NARROW case with regression guards, or leaves
gafico's width component pinned + documented in `ledger.md`. Do NOT broadly make
quoted titles literal.

**Consequences:** No regression of normal quoted-creole labels. gafico may stay
a partial residual — acceptable per the mission's realistic-outcome scope.

## ADR-3 — Emoji/wide-glyph width: fixed fallback or documented residual

**Decision:** The deterministic `WidthTableMeasurer` has no emoji metrics (the
oracle used real AWT). T3 measures whether ONE fixed fallback width for
above-BMP / emoji code points closes lurupu-11; if cheap and portable, apply it;
otherwise pin lurupu as a named residual/divergence (like LaTeX). Do NOT
hand-tune per-emoji widths to chase the oracle.

**Consequences:** Avoids a brittle per-glyph table. lurupu may stay a residual.

## ADR-4 — Faithful, scoped, no divergence

**Decision:** Match upstream per-context behavior; keep `resolveTextEscapes`
(core, shared) and the class/note path output-neutral; every non-conformant
fixture stays a named `size-backlog.json` entry.
