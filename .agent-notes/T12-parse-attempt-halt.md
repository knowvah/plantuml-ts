## Observation: parse-attempt dispatch makes routing equal command-table fidelity, in BOTH directions

- **Context**: `dispatch-by-parse-attempt` batch 3b (T12). Replaced `resolve()`'s
  `accepts()` scan with upstream's parse-attempt loop and re-mirrored
  registration order to `PSystemBuilder.java:134-141`.
- **Finding**: with dispatch decided by "first candidate whose parse does not
  refuse", a fixture routes correctly **iff** every earlier candidate refuses it
  exactly where upstream's factory does. Our command tables diverge from
  upstream's in both directions at once, so two distinct defect classes appear
  together:
  - **under-coverage** — we refuse a line upstream's factory registers, so the
    right engine drops the source and a later one (or none) takes it: **575**
    fixtures error where the jar rendered;
  - **over-acceptance** — we accept a line upstream's factory does NOT register,
    so an earlier candidate claims a source that was never its: **271** fixtures
    reach the wrong engine.
  Classified, the two are not independent: **151 of the 271 are secondary** to
  under-coverage (the correct engine refuses; closing its table reclaims them —
  all the `SEQUENCE → *` buckets). The other ~120 need the over-accepting table
  narrowed, which is a different kind of work.
- **Impact**: a mission that adds refusal must budget for BOTH. Porting missing
  commands alone leaves the over-acceptance class untouched, and narrowing
  tables alone leaves the error class untouched. Baselines: 3158 fixtures,
  2304 agree after T12, against 3148 agree / 2 misroute before the mission.
- **Confidence**: High — measured over the whole corpus, and the classification
  re-runs from `scripts`-free harnesses in the mission journal.

## Observation: one deferred execution refusal was worth 267 fixtures

- **Context**: same task. `CommandCreateElementFull2` MATCHES `component a` /
  `state a` on a class diagram, then fails execution unless `allowmixing` was
  set (`CommandCreateElementFull2.java:194-197`).
- **Finding**: this port recorded that violation and adjudicated it at END of
  parse, gated on the block also holding a native class construct — a
  documented compensation for the dispatcher being more eager than upstream's
  factory selection. Under parse-attempt the compensation is exactly wrong:
  refusing at the command is what hands the block to the next candidate.
- **Impact**: making it refuse immediately moved `DESCRIPTION -> CLASS` from
  200 fixtures to 4 and `STATE -> CLASS` from 150 to 79. When a port defers an
  upstream refusal "because our dispatcher is eager", fixing the dispatcher
  makes that deferral a live defect — look for the others.
- **Confidence**: High — measured before and after, single change.

## Observation: the mission brief's proof criterion was inverted

- **Context**: `plans/dispatch-by-parse-attempt/README.md` states
  "`component/kokebo-27-vafi688` routes CLASS; the jar says DESCRIPTION".
- **Finding**: both the committed golden and `routing-baseline.json` say the
  opposite — `jarType: CLASS`, `ourType: DESCRIPTION`.
- **Impact**: the criterion still closes under parse-attempt, but anyone
  reasoning from the brief's wording would look for the wrong outcome. Check a
  brief's factual claims against the baselines before building on them.
- **Confidence**: High — two independent committed sources agree.
