# SVG golden rebaseline — the "no SVG" fixture actually emits an error diagram

## Observation: `class-actor-bare-no-allowmixing` is an intentional error-diagram oracle, not a capture failure

- **Context**: executing mission `svg-output-size-reduction`, batch-1/T2.
  Both the mission README and
  `.agent-notes/svg-output-size-reduction-measured.md` state that
  `oracle/goldens/svg-class/class-actor-bare-no-allowmixing` "produces NO
  svg from the jar at all" and budget for it as the one known `FAILED`.
- **Finding**: it does produce one. Running the pinned jar directly:

  ```sh
  java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar \
       -tsvg -o <out> oracle/goldens/svg-class/class-actor-bare-no-allowmixing/in.puml
  # -> exit 200, writes in.svg (2147 B)
  ```

  The SVG is a PlantUML **error diagram** — green (`#33FF02`) on black —
  whose text reads `Use 'allowmixing' if you want to mix classes and other
  UML elements. (Assumed diagram type: class)`. The committed `golden.svg`
  (2645 B) is that same error diagram, captured before the "reduce SVG
  output size" commits. The fixture is authored (SI10/T3) and its own
  header comment says it deliberately covers a bare `actor` reachable
  *without* `allowmixing` — so pinning the jar's error output is the
  point, not an accident.
- **Mechanism of the original mismeasurement**: the ad-hoc scratch script
  that produced `SAME=0 CHANGED=445 FAILED=1` classified FAILED by the
  **jar's exit code**. `scripts/rebaseline-svg-goldens.ts` classifies by
  **SVG presence**, per its spec. The two definitions disagree on exactly
  this fixture, and on no other.
- **Impact**:
  - The expected summary is `FAILED=0`, not `FAILED=1`. The mission's
    stop condition "`FAILED` > 1" was sized for a failure that does not
    exist under the script's definition — treat any `FAILED > 0` as the
    stop.
  - Task T14 ("no-SVG fixture") has a void premise. There is nothing
    broken to fix; the work is recording the mechanism.
  - Exit code and SVG presence are genuinely independent signals, so
    `rebaseline-svg-goldens.ts` reports both: a non-zero jar exit produces
    an `ERROR-DIAGRAM=<n>` line and a per-fixture `jar exit <n> (error
    diagram)` detail, even when the bytes compare SAME. Classifying on
    either signal alone hides something — exit-code-only calls a valid
    error-diagram oracle a failure; bytes-only lets a *newly* broken
    fixture re-baseline its error diagram over a real rendering in
    silence.
- **Confidence**: High — jar run reproduced directly, exit code and byte
  count observed, golden content read.
