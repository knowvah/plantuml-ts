# Component map — what SI12 touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "scripts/build-stdlib-packages/ (T1, T2)" {
  [types.ts\nmodules? optional']:::t1] as types
  [package-specs.ts\naws/tupadr3 drop modules']:::t1] as specs
  [build-stdlib-packages.ts\nskip eager emit']:::t1] as build
  [emit-index.ts\nindex from remoteModules']:::t1] as idx
  [emit-all-index.ts\neager + manifests']:::t2] as allidx
  [emit-remote-manifest.ts\nUNCHANGED']:::keep] as remote
}

package "packages/ (T2, T3)" {
  [stdlib\nUNCHANGED, byte-identical']:::keep] as pstd
  [stdlib-aws\n16.7 → 8.3 MB']:::t3] as paws
  [stdlib-tupadr3\n40.8 → 20.3 MB']:::t3] as ptup
  [stdlib-all\nre-export both kinds']:::t2] as pall
}

package "tests/ (T1, T2, T4, T5)" {
  [stdlib-eager-omission\nNEW']:::t1] as tomit
  [stdlib-all-exports\nNEW']:::t2] as tall
  [stdlib-packages\nround-trip → assets']:::t4] as tpkg
  [stdlib-package-files\nLOWER the ceilings']:::t4] as tfiles
  [stdlib-remote-e2e\nre-base the baseline']:::t5] as te2e
}

[docs/stdlib-remote.md']:::t6] as docs
[planning/mission-index.md']:::t7] as index

types --> build
specs --> build
build --> idx
build --> remote
build --> allidx
build --> paws
build --> ptup
build --> pstd
allidx --> pall
paws --> tfiles
ptup --> tfiles
ptup --> te2e
paws --> tpkg
pall --> tall
build --> tomit
te2e --> docs
paws --> docs
docs --> index
@enduml
```

`assets/` is emitted unchanged for all three packages — it is what the CDN
recipe and SI11b's per-sprite loading resolve against (stop condition 5).
