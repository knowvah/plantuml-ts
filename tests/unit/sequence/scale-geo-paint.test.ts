import { describe, expect, it } from 'vitest';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import type { SequenceGeometry, MessageGeo, ActivationGeo } from '../../../src/diagrams/sequence/ast.js';
import type { SequencePaint } from '../../../src/diagrams/sequence/sequence-skin-param.js';

const THICKNESS = 0.5;
const SCALE = 2;

/** Lazy getters like `paintOf`'s: any read of an unscaled-by-design field other than `thickness` fails. */
function guardedPaint(): { paint: SequencePaint; reads: string[] } {
  const reads: string[] = [];
  const paint = new Proxy({} as SequencePaint, {
    get(_t, key) {
      reads.push(String(key));
      if (key === 'thickness') return THICKNESS;
      throw new Error(`eager read of ${String(key)}`);
    },
  });
  return { paint, reads };
}

const message = (paint?: SequencePaint): MessageGeo =>
  ({
    kind: 'message',
    fromX: 10,
    toX: 20,
    y: 5,
    label: '',
    labelLines: [],
    ...(paint ? { paint } : {}),
  }) as unknown as MessageGeo;
const activation = (paint?: SequencePaint): ActivationGeo => ({
  kind: 'activation',
  participantId: 'a',
  lifelineX: 3,
  y: 4,
  height: 6,
  level: 1,
  ...(paint ? { paint } : {}),
});
const geo = (events: SequenceGeometry['events']): SequenceGeometry => ({
  totalWidth: 1,
  totalHeight: 1,
  participants: [],
  events,
  headHeight: 1,
  lifelineEndY: 1,
  footerShapeY: 1,
  boxes: [],
  showFootbox: true,
});

describe('scaleSequenceGeometry paint', () => {
  it('leaves paint thickness 0.5 at 0.5 under scale 2: the jar scales at emission (SvgGraphics.java:466-468, :559)', () => {
    const { paint, reads } = guardedPaint();
    const [m, a] = scaleSequenceGeometry(geo([message(paint), activation(paint)]), SCALE).events as [
      MessageGeo,
      ActivationGeo,
    ];
    expect(m.paint).toBe(paint);
    expect(a.paint).toBe(paint);
    expect(m.paint!.thickness).toBe(THICKNESS);
    expect(m.fromX).toBe(20);
    expect(reads).toEqual(['thickness']);
  });

  it('adds no paint key to a geo that has none', () => {
    const [m] = scaleSequenceGeometry(geo([message()]), SCALE).events as [MessageGeo];
    expect('paint' in m).toBe(false);
    expect(m.toX).toBe(40);
  });
});
