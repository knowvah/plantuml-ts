# Batch 1 — klimt core (serial, after T0)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `FontPosition`, `FontConfiguration.fontPosition?` + `getFont`/`getSpace`, `CommandCreoleExposantChange` registered, `AtomText` muted width + starting altitude, `driver-text-svg` via `getFont` | general-purpose (Opus, effort high) | `src/core/klimt/font/FontPosition.ts` (new), `src/core/klimt/shape/UText.ts`, `src/core/klimt/creole/command/CommandCreoleExposantChange.ts` (new), `src/core/klimt/creole/legacy/CommandCreoleBuilder.ts`, `src/core/klimt/creole/legacy/AtomText.ts`, `src/core/klimt/drawing/svg/driver-text-svg.ts`, tests under `tests/unit/core/klimt/` | T0 | [x] |

**Interface contract (T1 → T2, T3, T4, T5)** — locked shape, names may be
refined by T1 and echoed in its report:
```ts
export type FontPosition = 'NORMAL' | 'EXPOSANT' | 'INDICE';          // klimt/font/FontPosition.ts
export function fontPositionSpace(p: FontPosition): number;           // -6 / +3 / 0   FontPosition.java:41-49
export function muteFontSize(size: number, p: FontPosition): number;  // size-3, min 2 FontPosition.java:51-60
export function fontPositionHtmlTag(p: FontPosition): 'sup' | 'sub';  // FontPosition.java:63-70
// UText.ts
export interface FontConfiguration { family; size; color; styles; readonly fontPosition?: FontPosition; }
export function getFont(fc: FontConfiguration): { readonly family: string; readonly size: number }; // FontConfiguration.java:98-104
export function getSpace(fc: FontConfiguration): number;                                            // FontConfiguration.java:370-372
```

**Expected manifest moves.** Registering the command strips the tags for
every klimt-lexed engine at once, so from T1 on: `juvagu-33-dupa212` + the
three authored slugs (T0's list). Anything else is stop 4.
