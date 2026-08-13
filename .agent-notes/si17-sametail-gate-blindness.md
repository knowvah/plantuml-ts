# Observation: `sametail` is emitted by the jar and checked by no gate — invisible DOT debt

- **Context**: SI17 T3, diagnosing the `:h` fall-through (batch-2 B1) on
  `pijiju-95-xexi872`. Found while reading that fixture's oracle DOT for a
  different reason.

- **Finding**: `pijiju-95-xexi872` uses `skinparam groupInheritance 2`, and its
  jar oracle carries **`sametail=ent0002` on both `implements` edges**. This
  port emits neither. The divergence is real and is currently **invisible to
  every gate**: `compareStructural` (`tests/oracle/svek-dot.ts`) does not check
  the `sametail` attribute at all, so the fixture scores EQUAL with the
  attribute missing. It is not part of B1 — B1's mechanism is the `:h`
  endpoint suffix, a different attribute on a different part of the line — and
  B1's fix did not and could not address it.

- **Impact**: This is debt that no measurement will ever surface, so it will be
  lost unless it is tracked in prose. Two consequences worth stating:
  (a) `pijiju-95-xexi872` counting inside class DOT's 710 EQUAL is correct
  *under the current comparator* and would flip the moment `sametail` is
  compared — the same shape of surprise the port-aware gate produced when it
  moved class 711 → 689 (see
  `.agent-notes/T8-member-ports-wrong-mechanism.md`). (b) More generally, a
  "structurally EQUAL" verdict bounds only the attributes the comparator reads;
  it is a floor on conformance, not a statement of it. Any future work on
  `groupInheritance` should implement `sametail` and widen `compareStructural`
  in the same change, so the gate can see its own fix.

- **Confidence**: High — read directly from the cached oracle DOT for
  `pijiju-95-xexi872`, and the comparator's attribute set was checked rather
  than assumed.
