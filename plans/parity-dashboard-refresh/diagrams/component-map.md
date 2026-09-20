# Component map — what this mission touches

```plantuml
@startuml
package "scripts/" {
  component [capture-oracle-cache.ts] as cap <<new T1>>
  component [svg-conformance-census.ts] as census <<T2>>
  component [svg-parity-survey.ts] as survey <<T3>>
  component [svg-parity-dashboard.ts] as svgdash <<T3>>
  component [dot-parity-rows.ts] as rows <<new T4>>
  component [dot-sync-report.ts] as dotsync <<T4>>
  component [parity-dashboard.ts] as dash <<new T6>>
}
package "tests/oracle/svg-conformance/" {
  component [render-fixture-*.ts] as helpers
  component [compare.ts / normalize.ts] as cmp
  component [oracle-freshness.test.ts] as fresh <<T5>>
  component [routing / refusal gates] as gates <<T5 re-pin>>
}
package "committed artifacts" {
  database "test-results/dot-cache/" as cache <<T5 +5 types>>
  database "parity-*.json / census-*.json" as json <<T7>>
  database "oracle/goldens/*/ratchet.json,\ndiff-baseline.json" as goldens
}
package "docs" {
  component [docs/parity-report.md] as report <<T6/T7>>
  component [docs-site/copy-reports.mjs] as site
  component [tests/unit/scripts/parity-dashboard.test.ts] as drift <<T6 drift gate>>
}

cap --> cache : writes
survey --> cache : reads
census --> cache : reads
census --> helpers : renders through
survey --> cmp : compares with
census --> cmp : compares with
survey --> json : writes parity-<type>.json
census --> json : writes census-<type>.json
dotsync --> rows : imports
dash --> rows : imports TypeRow[]
dash --> json : reads
dash --> goldens : reads
dash --> report : writes
drift --> report : asserts equal to rebuild
site --> report : mirrors
fresh --> cache : sentinels
gates --> cache : pinned per fixture
@enduml
```
