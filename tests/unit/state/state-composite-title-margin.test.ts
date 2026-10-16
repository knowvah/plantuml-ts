/**
 * A ClusterHeader-family composite's title Y comes from graphviz's placed
 * title table (`clusters[].label`), not a fixed constant.
 *
 * `DotStringFactory#solve` (`DotStringFactory.java:436-439`) calls
 * `cluster.setTitlePosition(SvekUtils.getMinXY(pointsTitle))` -- the min
 * corner of the title table polygon (`Cluster.java:274-276`). `drawUState`
 * (`Cluster.java:496-498`) then draws the title block with its TOP at
 * `xyTitle.getY()` (`HorizontalAlignment.draw` adds ypadding 0,
 * `HorizontalAlignment.java:85-88`), so the baseline is that min Y plus the
 * first line's ascent. The margin the renderer adds to `node.y` is therefore
 * `label.y - label.height / 2 - cluster.y`.
 *
 * Oracle: `state/decede-10-buvu414` cluster `E`: box y 16.5, title table
 * centre y 25, height 9 -> min Y 20.5 -> margin 4; jar baseline 38.389.
 */
import { describe, it, expect } from 'vitest';
import { clusterTitleBaselineMargin } from '../../../src/diagrams/state/state-composite-geo.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const CLUSTER = { id: 'cluster0', x: 220.78, y: 16.5, width: 82, height: 99 };

describe('clusterTitleBaselineMargin', () => {
  it('is the title table min Y relative to the cluster top', () => {
    const label = { x: 261.78, y: 25, width: 9, height: 9 };
    expect(clusterTitleBaselineMargin({ ...CLUSTER, label })).toBe(4);
  });

  it('reads the label rect, not a constant', () => {
    const label = { x: 261.78, y: 30, width: 9, height: 13 };
    expect(clusterTitleBaselineMargin({ ...CLUSTER, label })).toBe(7);
  });

  it('is undefined without a placed title (Cluster.xyTitle stays null)', () => {
    expect(clusterTitleBaselineMargin(CLUSTER)).toBeUndefined();
  });
});

describe('composite title baseline', () => {
  it('equals the jar for decede-10-buvu414 cluster E', () => {
    const src = `@startuml
<style>
stateDiagram {
  RoundCorner 2
  Shadowing 0
  BackgroundColor cyan
  LineColor green
  FontColor red
}
</style>
state A {
  state B {
  }
  state C {
    state c : state c
  }
}

state E {
  state F
}

state S1 : state S1
state S2

F --> S1

@enduml`;
    const svg = renderSync(src, { measurer: new DeterministicMeasurer() });
    expect(/<text x="[\d.]+" y="([\d.]+)"[^>]*>E<\/text>/.exec(svg)?.[1]).toBe('38.389');
  });
});
