# cdd8 T0c: ELK spike (elkjs 0.12.0 vs the jar on cadutu-02-lazu601)

## Observation: elkjs 0.12.0 reproduces the jar's ELK layout
- **Context**: spike `plans/class-divergence-drive-8/spike/elk-spike.cjs`, node
  sizes taken from the jar SVG, graph built as `CucaDiagramFileMakerElk` does.
- **Finding**: every node x/y and edge section point matches `in.svg` within
  1e-3 (the SVG's own 3 dp rounding; compare.ts tolerance 0.01). Translate is
  (0,0): `getPosition` (`CucaDiagramFileMakerElk.java:281-296`) returns raw x,y
  under root; the jar's y=12 is ELK layered's default root padding; document
  margin is `CucaDiagram.getDefaultMargins()` (0,5,5,0). Layout ~3 ms/call,
  module load + register ~45-65 ms, peak heap ~25 MB.
- **Impact**: the port can target exact geometry; any ELK residue is a port bug.
- **Confidence**: High (re-run by the orchestrator)

## Observation: upstream's proxy passes a proxy-typed EnumSet to ELK
- **Context**: `NODE_LABELS_PLACEMENT` at `CucaDiagramFileMakerElk.java:397-398`.
- **Finding**: `elk/proxy/graph/ElkWithProperty.java:30-39` builds
  `EnumSet.noneOf(elk.getClass())` and adds the proxy object itself, never
  `getTrueObject()`. ELK therefore receives an EnumSet of proxy enums, and
  `contains(INSIDE)` etc. are false. On cadutu, "Java intent" and "unset" give
  identical coordinates. elkjs JSON cannot express the proxy set.
- **Impact**: the elkjs adapter must mirror the effective behaviour (property
  not honoured), not the intended `[INSIDE, H_CENTER, V_CENTER]`. Needs a
  fixture where node-label placement matters to tell them apart.
- **Confidence**: High (Java read; agent also checked javap on the jar)

## Observation: every edge gets a centre label, even an empty one
- **Finding**: `getLabel` returns `EMPTY_TEXT_BLOCK`, never null, so `:421`
  creates an "X" centre label (0x0) for every link. Edge/label coordinates
  from elkjs are root-relative; for clusters `getPosition` recurses only
  through parents with labels (`:288`), so clusters need their "C" label
  (`:337-338`). Cluster case unverified.
- **Impact**: the maker port must keep the empty label and the cluster label.
- **Confidence**: Medium (cluster half unverified)

## Observation: the jar registers only the layered algorithm
- **Finding**: oracle jar `META-INF/services/...ILayoutMetaDataProvider` lists
  only `LayeredMetaDataProvider`; no algorithm is set in upstream. All five
  `org.eclipse.elk/*/pom.properties` say 0.12.0. elkjs license:
  `EPL-2.0 OR GPL-3.0-or-later`.
- **Confidence**: High
