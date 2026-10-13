# T3c (F3): `HColorAutomagic` + `HColorSet`'s `automatic` branch (D15)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (sonnet). Pre-approved core (D15).

## Mechanism (journal row 26)
`HColorSet.java:85-86`: `if (s.equalsIgnoreCase("automatic")) return new HColorAutomagic();`
(HColorAutomagic.java, 44 lines: `getAppropriateColor(back) = back.opposite()`). The port throws
`unported('HColorAutomagic')` (`src/core/klimt/color/HColorSet.ts` ~:384), so `colors automatic`
draws our error page where the jar draws the FULL grid (1401x589): `PSystemColors.java:99/:122`'s
`instanceof HColorSimple` fails and it falls through to `drawFull`. Probe fixture:
`tests/unit/eggs/fixtures/colors-*.{puml,jar.svg}` precedent (T1b) — add `colors-automatic` there
only if T1b's fixture dir is in your write-set; otherwise render it under `tests/unit/core/klimt/color/`.

## Task (TDD)
Port `HColorAutomagic` (and whatever `HColor` members it overrides — read the base class) and the
`HColorSet` branch. Then audit EVERY caller of `parseColor`/`getColorOrWhite`/`getColor` in
`src/` for what it now receives on `automatic` instead of a throw, mirroring each Java caller's
handling (`getAppropriateColor` call sites, e.g. `HColors`/`UGraphic` paths — grep
`getAppropriateColor` in the Java). Survey every engine whose corpus contains the word
`automatic` in a colour position before/after; report movers with mechanisms.

## Write-set
`src/core/klimt/color/{HColorAutomagic,HColorSet}.ts` (+ the HColor base file if a member is
needed), the call-site files the audit proves must change (list each with its Java quote in the
report; a file another running task owns is a stop), tests, `docs/catalog.md`,
`.agent-notes/ufp-T3c.md`. NOT `src/diagrams/eggs/**`.

**Observability:** N/A. **Rollback:** Reversible.
