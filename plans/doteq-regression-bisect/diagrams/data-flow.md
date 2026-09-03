# Data flow — one bisect step

```plantuml
@startuml
autonumber
participant "git bisect" as B
participant "worktree\n(one per fixture, D4)" as W
participant "predicate\n(pinned from HEAD)" as P
database "dot-cache\n(jar oracle)" as C

B -> W : checkout <candidate sha>
W -> W : git checkout HEAD -- scripts/, tests/oracle/\n(D1: pin the ruler)
alt predicate builds
  W -> P : npx jiti --render-one <cacheDir>
  P -> C : read in.puml, svek-1.dot
  P -> P : renderSync via the candidate's src/
  P -> B : {dotEqual}
  alt dotEqual == true
    B -> B : mark good
  else
    B -> B : mark bad
  end
else will not compile against pinned predicate
  W -> B : git bisect skip (D2)\nrecord sha + reason
end
B -> B : narrow, repeat (~10 steps)
@enduml
```

The `skip` branch is why a bisect may end on a **span** rather than a single
commit. A span is still actionable, but stop condition 4 still applies: the
artifact must name a mechanism either way.
