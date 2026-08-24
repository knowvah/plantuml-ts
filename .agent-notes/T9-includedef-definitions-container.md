## Observation: `!includedef` throws on a same-document definition miss instead of resolving silently empty

- **Context**: T9 of `plans/routing-heuristic-repair`, diagnosing
  `test-results/dot-cache/sequence/nuvoja-46-dezu541` — jar renders it
  `SEQUENCE`, this port produces a document with no `data-diagram-type` at
  all because `buildBlockUmls` returns `ok: false` for the block. Diagnosis
  only (per `~/.claude/rules/diagnosis.md`); no fix landed — see rationale
  below.

- **Mechanism**: `!includedef NAME` in this port is wired to the same
  file/store-backed include seam as `!include`/`!includesub` (a documented,
  pre-existing divergence — see the "PLANTUML-TS DIVERGENCE" comment already
  at `src/core/tim/IncludeExecutor.ts:114-122`). Upstream's `!includedef`
  is NOT a file lookup at all: it searches the OTHER `@startdef(id=NAME)`
  blocks already parsed from the SAME source document, and a name that
  matches no such block resolves to an **empty definition** — a silent
  no-op, never an error. `in.puml` has `!includedef macro` and no
  `@startdef(id=macro)` block anywhere (in fact no `@startdef` block at
  all), so upstream continues past the directive with nothing inserted and
  renders `Alice -> Bob : hello2` as an ordinary 2-actor sequence diagram
  (confirmed against `in.svg`, `data-diagram-type="SEQUENCE"`). This port's
  `IncludeExecutor` has no notion of a document-local `@startdef` container,
  so it always routes the lookup through `this.load()`, which treats any
  key the store doesn't recognise as `IncludeNotFoundError` — turning a
  benign no-op into a hard interpreter failure.

- **Origin**: `src/core/tim/IncludeExecutor.ts:127` — the
  `this.load(definitionName, '!includedef')` call inside `executeIncludeDef`
  (method spans `IncludeExecutor.ts:123-129`) — which reaches the `throw
  new IncludeNotFoundError(what, directive)` at `IncludeExecutor.ts:179`
  inside the shared `load()` helper (`IncludeExecutor.ts:161-180`), the
  same helper `!include`/`!import` use for genuine file/stdlib lookups.
  `EaterIncludeDef.ts` itself is not implicated — it correctly parses the
  directive's argument as `"macro"` (confirmed by the thrown error's own
  message, see Ruled out below).

- **Causal chain**:
  1. `in.puml` line 2 is `!includedef macro`.
  2. `TContext.executeOneLineNotSafe` (`src/core/tim/TContext.ts:187`) →
     `executeSideEffectDirective` (`TContext.ts:229`) →
     `executeIncludeDirective` (`TContext.ts:274`) dispatches to
     `IncludeExecutor.executeIncludeDef` (`IncludeExecutor.ts:123`).
  3. `executeIncludeDef` treats `"macro"` as a store key and calls
     `this.load("macro", "!includedef")` (`IncludeExecutor.ts:127`).
  4. `load()` finds no direct store hit, no `!import`-registered prefix
     hit, and `"macro"` doesn't match the `<bundle/thing>` stdlib pattern,
     so it throws `IncludeNotFoundError` (`IncludeExecutor.ts:179`).
  5. The exception propagates up through `TContext.executeLines`
     (`TContext.ts:147`) uncaught until `preprocessLinesOrError`'s
     try/catch (`src/core/preprocessor.ts:481-488`), which is working
     exactly as designed — it captures whatever `TContext` throws and
     returns `{ ok: false, failure: {...} }` (`preprocessor.ts:483-488`).
  6. `buildBlockUml` (`src/core/BlockUmlBuilder.ts:139-142`) sees
     `!outcome.ok` and returns a `BlockUmlErr` for the block — the ONLY
     block in this one-block document.
  7. With no `BlockUmlOk` block anywhere, nothing downstream ever builds a
     diagram or emits `data-diagram-type` — the observed empty document.

  Confirmed live (not inferred) by invoking `buildBlockUmls(source)`
  directly on the fixture's `in.puml`: it returns one block, `ok: false`,
  `failure.cause` is `IncludeNotFoundError: Cannot resolve !includedef
  'macro': it is not in the IncludeStore`, with a stack trace running
  exactly through `IncludeExecutor.ts:179` → `:127` →
  `TContext.ts:274/229/187/147` → `preprocessor.ts:482` →
  `BlockUmlBuilder.ts:140/106`.

- **Upstream method for the same construct**:
  `TContext.executeIncludeDef` (`~/git/plantuml/src/main/java/net/
  sourceforge/plantuml/tim/TContext.java:687-709`) calls
  `definitionsContainer.getDefinition(definitionName)` (line 693).
  `BlockUmlBuilder implements DefinitionsContainer`
  (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/
  BlockUmlBuilder.java:60`); its `getDefinition` (lines 150-156) scans
  `this.blocks` (every block already parsed from the file) for one whose
  `isStartDef(name)` is true and returns **`Collections.emptyList()`** if
  none matches — never throws. `BlockUml.isStartDef`
  (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/BlockUml.java:
  241-244`) tests the block's first line against the literal signature
  `"@startdef(id=" + name + ")"` — a dedicated `@startdef`/`@enddef` block
  type, not `@startuml(id=...)`. Back in `TContext.executeIncludeDef`, an
  empty `definition` list makes the `ReadLineList` reader return `null`
  immediately, so `executeLinesInternal(memory, body=[], null)` runs with
  an empty body and returns normally (`TContext.java:696-705`) — a no-op,
  not an exception. What upstream does differently: `!includedef` is a
  same-document named-block lookup with a graceful empty-on-miss fallback;
  this port's `!includedef` is a file/store lookup with a hard-fail-on-miss
  contract, because this port has no `@startdef` block concept or
  `DefinitionsContainer` equivalent at all.

- **Ruled out** (with evidence):
  - **`EaterIncludeDef.ts` mis-parsing the directive argument.** Ruled out:
    the thrown `IncludeNotFoundError`'s own message reads `Cannot resolve
    !includedef 'macro'` — the argument was extracted correctly as
    `"macro"`, not malformed or truncated.
  - **`BlockUmlBuilder.ts`'s block-splitting (`splitRawBlocks`) mishandling
    this one-block document.** Ruled out: the direct repro shows exactly
    one block returned, and it reaches `preprocessLinesOrError` (i.e. gets
    past block-splitting) before failing — the failure trace's outermost
    frames are `BlockUmlBuilder.ts:140` then `:106`, both post-split.
  - **`preprocessor.ts`'s error capture (`preprocessLinesOrError`)
    swallowing or mis-wrapping something.** Ruled out: the try/catch there
    (`preprocessor.ts:481-488`) rethrows the SAME `IncludeNotFoundError`
    object unchanged as `failure.cause` — it is not altering upstream
    behavior, it is faithfully reporting what `TContext` threw. The defect
    is that `TContext`/`IncludeExecutor` throws in a case upstream would
    not.
  - **The routing-conformance test harness's `IncludeStore` being
    misconfigured for this fixture** (e.g. missing a `macro` entry it
    "should" have). Ruled out by reading `tests/helpers/
    fixture-include-store.ts`: the harness's base store is
    `{ get: () => undefined, has: () => false }` for everything except
    `<bundle/thing>` stdlib keys — by design, since almost no fixture uses
    a real include. `"macro"` was never meant to resolve through a file
    store; upstream never asks a file store for it either. Even a
    "perfectly populated" store would not fix this, because the port's
    architecture routes `!includedef` to the wrong resolution mechanism
    entirely (file/store lookup instead of same-document `@startdef`-block
    lookup) — confirming the defect is architectural, not a fixture/harness
    data gap.
  - **The dispatcher/routing logic itself choosing the wrong diagram
    type.** Ruled out: routing is never reached. The block never becomes
    `ok: true`, so there is no `source`/`preprocessed` for any downstream
    stage — including the type-dispatch — to run against. The observed
    "no `data-diagram-type`" is a total absence of a diagram, not a
    mis-typed one.

- **Why no fix landed (stop condition, per task boundary)**: the mission's
  write-set for a fix is limited to `src/core/preprocessor.ts` and
  `src/core/BlockUmlBuilder.ts`. The mechanism's origin —
  `IncludeExecutor.executeIncludeDef` treating a `!includedef` miss as a
  hard file-not-found — lives in `src/core/tim/IncludeExecutor.ts`, the
  TIM interpreter, which is outside that write-set. A conforming fix is not
  a small patch inside the boundary files: it requires (1) recognising
  `@startdef(id=NAME)`/`@enddef` as a real block construct (not currently
  ported at all), (2) `BlockUmlBuilder.ts` assembling a per-document
  definitions container from ALL such blocks BEFORE any one block is
  preprocessed — a structural change, since `buildBlockUmls` today maps
  each raw block to `preprocessLinesOrError` independently with no
  sibling-block awareness — and (3) threading that container through
  `PreprocessOptions`/`TContextOptions` into `IncludeExecutor.
  executeIncludeDef` so it resolves against the container (with a graceful
  empty-list fallback) instead of `this.load()`. That last step edits
  `src/core/tim/IncludeExecutor.ts` (and likely `TContextOptions.ts`),
  both outside this task's declared write-set. Per the task's own
  boundary ("Ask first: if the mechanism is real but the fix belongs to
  another module — record it and let a separate mission have it") and its
  explicit stop instruction ("If the fix lands outside those two, STOP and
  report: a preprocessor defect reaching into an engine is a different
  mission"), this is recorded as a stop, not a fix. The fixture stays
  pinned; SLI for this bucket (`SEQUENCE -> NONE`) remains 1.

- **Confidence**: High — mechanism confirmed by direct instrumentation
  (live call to `buildBlockUmls` on the fixture's actual source, full
  stack trace captured) and by reading both the upstream Java method
  (`TContext.java:687-709`) and its `DefinitionsContainer` implementation
  (`BlockUmlBuilder.java:150-156`, `BlockUml.java:241-244`) that produces
  the divergent behavior.
