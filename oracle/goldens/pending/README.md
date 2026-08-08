# `oracle/goldens/pending/` — authored fixtures whose fix has not landed yet

ADR-7 of the `s1l-tail-fix` mission requires every reproduced-but-uncovered
defect to get an **authored `.puml` plus a generated jar oracle**, not a
synthetic-only check. Some of those fixtures are authored in one task and
fixed in a later one.

A directory here has the exact shape of an
`oracle/goldens/<engine>/<slug>/` golden (`input.puml` + `svek-N.dot`,
generated with the mandatory `-DPLANTUML_DETERMINISTIC_TEXT=true` flag), but
lives **outside** every ratchet's scan path — `measure-*-size-deltas.ts` and
`tests/oracle/*.ratchet.test.ts` each join to their own exact engine
directory, so nothing here is measured or gated.

That is deliberate. A brand-new golden under `oracle/goldens/description/`
with no `size-backlog.json` pin classifies as `widened`, which is a mission
stop condition — and ADR-1 forbids a task from writing `size-backlog.json`
itself. Staging here lets the oracle land with the task that *authored* it
while the ratchet stays honest.

**Promoting a fixture:** the task that lands the fix moves the directory to
`oracle/goldens/<engine>/<slug>/` and adds its `size-backlog.json` entry (a
NEW pin, explicitly distinguished from a forbidden regeneration by ADR-7).
If the fix makes it conformant outright, no pin is needed.

| directory | authored by | defect | fixed by |
|---|---|---|---|
| ~~`f4d-url-label-first-line`~~ | F2-c | a display whose FIRST line is entirely `[[url label]]` measures the url text as well as the label | **PROMOTED** by F4-d to `oracle/goldens/description/f4d-url-label-first-line/` — fully conformant (delta 0 on all four rows), no `size-backlog.json` pin needed. Oracle bytes unchanged (never regenerated). |

No directory is currently staged here.

## `f4d-url-label-first-line`

Four `rectangle`s, one per shape, measured against `svek-1.dot`:

| node | display | jar | ours (at F2-c) |
|---|---|---|---|
| `URLLABEL` | `[[http://www.google.com abc]]` | `0.591319` | `2.663368` |
| `URLONLY` | `[[http://www.google.com]]` | `2.242882` | `2.349826` |
| `URLSPRITE` | `[[http://www.google.com <$maxime>]]` | `0.944444 x 0.944444` | `3.067775 x 0.995726` |
| `URLSECONDLINE` | `You can click\n[[http://www.google.com <$maxime>]]` | `1.316840 x 1.138889` | **exact** |

`URLSECONDLINE` is the regression guard, not a defect row: it is
`bivira-53-boja685`'s own shape (the url is NOT the first line) and F2-c's
G10 fix already closes it. F4-d's acceptance criterion 4 requires it to stay
exact.

`URLSPRITE`'s HEIGHT row also depends on F2-c: once the parse defect is
fixed, that sprite is recognized as sitting inside a `[[url ...]]` label, so
`spriteAtomScale` drops the `fontSize/13` factor and `48 + 20 = 68px =
0.944444in` falls out. Without G10 it would land on `51.692 + 20`.
