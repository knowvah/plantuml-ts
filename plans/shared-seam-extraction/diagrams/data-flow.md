# Data flow — document assembly before/after T8

Before: core switches on four engine flags and calls four engine assemblers.
After: the engine prepares its body and names its type; core owns the one
shell (`TextBlockExporter.java:293`).

```plantuml
@startuml
participant "renderSync" as R
participant "engine plugin\n(class/state/description/json)" as E
participant "core/assemble-svg" as A
participant "core/klimt/document-shell" as S
R -> E : layoutSync + render
E -> E : prepare body\n(bg/border rect splice, <g> wrap — engine-owned)
E --> R : RenderFragment { body, width, height, diagramType }
R -> A : assembleSvg(fragment)
alt fragment.completeSvg
  A --> R : completeSvg (unchanged escape hatch)
else fragment.diagramType set
  A -> S : assembleDocumentShell(fragment, diagramType)
  S --> A : "<svg data-diagram-type=…>…</svg>"
  A --> R : svg
else
  A -> A : svgRoot(width, height, body, background, extraDefs)
  A --> R : svg
end
@enduml
```

Evidence loop for every task (D6):

```plantuml
@startuml
start
:git checkout branch point;
:npm run manifest --out baseline.json (T0);
repeat
  :task Tn: move + rewire;
  :npm run manifest --out cur.json;
  :npm run manifest --diff baseline.json cur.json;
  if (0 fixtures differ?) then (yes)
    :4 gates + dot-sync;
    :commit;
  else (no)
    if (T1 and every fixture moves toward jar golden?) then (yes)
      :journal per fixture; commit;
    else (no)
      :STOP — diagnose (rules/diagnosis.md);
      stop
    endif
  endif
repeat while (tasks remain?)
:T10 — KNOWN_DEBT = [], final manifest, docs;
stop
@enduml
```
