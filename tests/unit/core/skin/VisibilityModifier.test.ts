import { describe, expect, it } from 'vitest';
import { ColorParam, VisibilityModifier } from '../../../../src/core/skin/VisibilityModifier.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../src/core/klimt/UShape.js';
import type { UParam } from '../../../../src/core/klimt/UParam.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { UGroup } from '../../../../src/core/klimt/shape/UGroup.js';
import { UGroupType } from '../../../../src/core/klimt/shape/UGroup.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../src/core/klimt/Back.js';
import { URectangle } from '../../../../src/core/klimt/shape/URectangle.js';
import { UEllipse } from '../../../../src/core/klimt/shape/UEllipse.js';
import { UPolygon } from '../../../../src/core/klimt/shape/UPolygon.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { Paint } from '../../../../src/core/paint.js';

interface DrawEvent {
  readonly type: 'draw';
  readonly shape: UShape;
  readonly dx: number;
  readonly dy: number;
  readonly fore: Paint | undefined;
  readonly back: Paint | undefined;
}
interface GroupEvent {
  readonly type: 'startGroup' | 'closeGroup';
  readonly map?: ReadonlyMap<UGroupType, string>;
}
type Event = DrawEvent | GroupEvent;

/**
 * A recording fake supporting the `startGroup`/`closeGroup` surface
 * (the `UGraphicWithGroups` shape `VisibilityModifier` narrows to —
 * same duck-typed contract as `svek/DecorateEntityImage.ts`).
 */
class RecordingUGraphic implements UGraphic {
  readonly events: Event[];
  private readonly dx: number;
  private readonly dy: number;
  private readonly fore: Paint | undefined;
  private readonly back: Paint | undefined;

  constructor(events: Event[] = [], dx = 0, dy = 0, fore?: Paint, back?: Paint) {
    this.events = events;
    this.dx = dx;
    this.dy = dy;
    this.fore = fore;
    this.back = back;
  }

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate)
      return new RecordingUGraphic(
        this.events,
        this.dx + change.getDx(),
        this.dy + change.getDy(),
        this.fore,
        this.back,
      );
    if (change instanceof Fore)
      return new RecordingUGraphic(this.events, this.dx, this.dy, change.getColor(), this.back);
    if (change instanceof Back)
      return new RecordingUGraphic(this.events, this.dx, this.dy, this.fore, change.getBackColor());
    throw new Error('RecordingUGraphic: unsupported change');
  }

  draw(shape: UShape): void {
    this.events.push({ type: 'draw', shape, dx: this.dx, dy: this.dy, fore: this.fore, back: this.back });
  }

  getParam(): UParam {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return new UTranslate(this.dx, this.dy);
  }

  getStringBounder(): StringBounder {
    return { calculateDimension: () => new XDimension2D(0, 0) };
  }

  startGroup(group: UGroup): void {
    this.events.push({ type: 'startGroup', map: group.asMap() });
  }

  closeGroup(): void {
    this.events.push({ type: 'closeGroup' });
  }
}

/** A UGraphic WITHOUT startGroup/closeGroup, to exercise the narrowing throw. */
class GrouplessUGraphic implements UGraphic {
  apply(): UGraphic {
    return this;
  }
  draw(): void {
    /* no-op */
  }
  getParam(): UParam {
    throw new Error('not needed');
  }
  getTranslate(): UTranslate {
    return new UTranslate(0, 0);
  }
  getStringBounder(): StringBounder {
    return { calculateDimension: () => new XDimension2D(0, 0) };
  }
}

function drawEvents(events: Event[]): DrawEvent[] {
  return events.filter((e): e is DrawEvent => e.type === 'draw');
}

/** Indexed access with a hard assert (noUncheckedIndexedAccess). */
function drawAt(events: Event[], idx: number): DrawEvent {
  const draw = drawEvents(events)[idx];
  if (draw === undefined) throw new Error(`no draw event at index ${idx}`);
  return draw;
}

describe('VisibilityModifier — parsing statics (Member.java:133-134 callers)', () => {
  it('regexForVisibilityCharacter is the upstream literal (no *)', () => {
    expect(VisibilityModifier.regexForVisibilityCharacter()).toBe('[-#+~]');
  });

  it('isVisibilityCharacter accepts -, #, +, ~, * with len > 2 and no doubling', () => {
    for (const c of ['-', '#', '+', '~', '*']) expect(VisibilityModifier.isVisibilityCharacter(`${c}ab`)).toBe(true);
    expect(VisibilityModifier.isVisibilityCharacter('--ab')).toBe(false);
    expect(VisibilityModifier.isVisibilityCharacter('+a')).toBe(false); // length <= 2
    expect(VisibilityModifier.isVisibilityCharacter('xab')).toBe(false);
  });

  it('getVisibilityModifier maps field characters', () => {
    expect(VisibilityModifier.getVisibilityModifier('-abc', true)).toBe(VisibilityModifier.PRIVATE_FIELD);
    expect(VisibilityModifier.getVisibilityModifier('#abc', true)).toBe(VisibilityModifier.PROTECTED_FIELD);
    expect(VisibilityModifier.getVisibilityModifier('+abc', true)).toBe(VisibilityModifier.PUBLIC_FIELD);
    expect(VisibilityModifier.getVisibilityModifier('~abc', true)).toBe(VisibilityModifier.PACKAGE_PRIVATE_FIELD);
    expect(VisibilityModifier.getVisibilityModifier('*abc', true)).toBe(VisibilityModifier.IE_MANDATORY);
  });

  it('getVisibilityModifier maps method characters', () => {
    expect(VisibilityModifier.getVisibilityModifier('-abc', false)).toBe(VisibilityModifier.PRIVATE_METHOD);
    expect(VisibilityModifier.getVisibilityModifier('#abc', false)).toBe(VisibilityModifier.PROTECTED_METHOD);
    expect(VisibilityModifier.getVisibilityModifier('+abc', false)).toBe(VisibilityModifier.PUBLIC_METHOD);
    expect(VisibilityModifier.getVisibilityModifier('~abc', false)).toBe(VisibilityModifier.PACKAGE_PRIVATE_METHOD);
    expect(VisibilityModifier.getVisibilityModifier('*abc', false)).toBe(VisibilityModifier.IE_MANDATORY);
  });

  it('getVisibilityModifier rejects short strings, doubled chars and non-modifiers', () => {
    expect(VisibilityModifier.getVisibilityModifier('+a', true)).toBeNull();
    expect(VisibilityModifier.getVisibilityModifier('++ab', false)).toBeNull();
    expect(VisibilityModifier.getVisibilityModifier('xabc', true)).toBeNull();
  });

  it('getByUnicode finds each modifier by its StringUtils char', () => {
    expect(VisibilityModifier.getByUnicode('')).toBe(VisibilityModifier.PRIVATE_FIELD);
    expect(VisibilityModifier.getByUnicode('')).toBe(VisibilityModifier.PUBLIC_FIELD);
    expect(VisibilityModifier.getByUnicode('')).toBe(VisibilityModifier.PUBLIC_METHOD);
    expect(VisibilityModifier.getByUnicode('')).toBe(VisibilityModifier.IE_MANDATORY);
    expect(VisibilityModifier.getByUnicode('x')).toBeNull();
  });

  it('replaceVisibilityModifierByUnicodeChar substitutes the first char', () => {
    expect(VisibilityModifier.replaceVisibilityModifierByUnicodeChar('+name', true)).toBe('name');
    expect(VisibilityModifier.replaceVisibilityModifierByUnicodeChar('-name', false)).toBe('name');
    expect(VisibilityModifier.replaceVisibilityModifierByUnicodeChar('name', true)).toBe('name');
  });
});

describe('VisibilityModifier — accessors', () => {
  it('values() exposes all 9 constants in declaration order', () => {
    expect(VisibilityModifier.values()).toEqual([
      VisibilityModifier.PRIVATE_FIELD,
      VisibilityModifier.PROTECTED_FIELD,
      VisibilityModifier.PACKAGE_PRIVATE_FIELD,
      VisibilityModifier.PUBLIC_FIELD,
      VisibilityModifier.PRIVATE_METHOD,
      VisibilityModifier.PROTECTED_METHOD,
      VisibilityModifier.PACKAGE_PRIVATE_METHOD,
      VisibilityModifier.PUBLIC_METHOD,
      VisibilityModifier.IE_MANDATORY,
    ]);
  });

  it('getForeground/getBackground carry the ColorParam stubs', () => {
    expect(VisibilityModifier.PRIVATE_FIELD.getForeground()).toBe(ColorParam.iconPrivate);
    expect(VisibilityModifier.PRIVATE_FIELD.getBackground()).toBeNull();
    expect(VisibilityModifier.PUBLIC_METHOD.getForeground()).toBe(ColorParam.iconPublic);
    expect(VisibilityModifier.PUBLIC_METHOD.getBackground()).toBe(ColorParam.iconPublicBackground);
    expect(VisibilityModifier.IE_MANDATORY.getForeground()).toBe(ColorParam.iconIEMandatory);
    expect(VisibilityModifier.IE_MANDATORY.getBackground()).toBe(ColorParam.iconIEMandatory);
  });

  it('ColorParam stubs carry the upstream HColors defaults', () => {
    expect(ColorParam.iconPrivate.defaultValue).toBe('#C82930');
    expect(ColorParam.iconPrivateBackground.defaultValue).toBe('#F24D5C');
    expect(ColorParam.iconPackage.defaultValue).toBe('#1963A0');
    expect(ColorParam.iconPackageBackground.defaultValue).toBe('#4177AF');
    expect(ColorParam.iconProtected.defaultValue).toBe('#B38D22');
    expect(ColorParam.iconProtectedBackground.defaultValue).toBe('#FFFF44');
    expect(ColorParam.iconPublic.defaultValue).toBe('#038048');
    expect(ColorParam.iconPublicBackground.defaultValue).toBe('#84BE84');
    expect(ColorParam.iconIEMandatory.defaultValue).toBe('#000000');
    expect(ColorParam.iconPrivate.name).toBe('iconPrivate');
    expect(ColorParam.iconPrivate.isBackground).toBe(false);
  });

  it('getXmiVisibility maps pairs and throws on IE_MANDATORY', () => {
    expect(VisibilityModifier.PUBLIC_FIELD.getXmiVisibility()).toBe('public');
    expect(VisibilityModifier.PUBLIC_METHOD.getXmiVisibility()).toBe('public');
    expect(VisibilityModifier.PRIVATE_METHOD.getXmiVisibility()).toBe('private');
    expect(VisibilityModifier.PROTECTED_FIELD.getXmiVisibility()).toBe('protected');
    expect(VisibilityModifier.PACKAGE_PRIVATE_METHOD.getXmiVisibility()).toBe('package');
    expect(() => VisibilityModifier.IE_MANDATORY.getXmiVisibility()).toThrow();
  });

  it('isField is true exactly for the four field constants', () => {
    expect(VisibilityModifier.PUBLIC_FIELD.isField()).toBe(true);
    expect(VisibilityModifier.PRIVATE_FIELD.isField()).toBe(true);
    expect(VisibilityModifier.PROTECTED_FIELD.isField()).toBe(true);
    expect(VisibilityModifier.PACKAGE_PRIVATE_FIELD.isField()).toBe(true);
    expect(VisibilityModifier.PUBLIC_METHOD.isField()).toBe(false);
    expect(VisibilityModifier.IE_MANDATORY.isField()).toBe(false);
  });

  it('getStyleSignature carries root/element/visibilityIcon plus the variant SName', () => {
    expect(VisibilityModifier.IE_MANDATORY.getStyleSignature().names).toEqual([
      'root',
      'element',
      'visibilityIcon',
      'IEMandatory',
    ]);
    expect(VisibilityModifier.PUBLIC_FIELD.getStyleSignature().names[3]).toBe('public_');
    expect(VisibilityModifier.PRIVATE_METHOD.getStyleSignature().names[3]).toBe('private_');
    expect(VisibilityModifier.PROTECTED_METHOD.getStyleSignature().names[3]).toBe('protected_');
    expect(VisibilityModifier.PACKAGE_PRIVATE_FIELD.getStyleSignature().names[3]).toBe('package_');
  });
});

describe('VisibilityModifier — icon drawing geometry', () => {
  it('getUDrawable wraps the icon in a data-visibility-modifier group', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PRIVATE_FIELD.getUDrawable(8, '#111111', null).drawU(ug);
    expect(ug.events[0]).toEqual({
      type: 'startGroup',
      map: new Map([[UGroupType.DATA_VISIBILITY_MODIFIER, 'PRIVATE_FIELD']]),
    });
    expect(ug.events.at(-1)).toEqual({ type: 'closeGroup' });
  });

  it('PRIVATE draws a (size-4) square at (+2,+2) with fore color and none background', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PRIVATE_FIELD.getUDrawable(8, '#C82930', null).drawU(ug);
    const draw = drawAt(ug.events, 0);
    expect(draw.shape).toBeInstanceOf(URectangle);
    expect((draw.shape as URectangle).getWidth()).toBe(4);
    expect((draw.shape as URectangle).getHeight()).toBe(4);
    expect([draw.dx, draw.dy]).toEqual([2, 2]);
    expect(draw.fore).toBe('#C82930');
    expect(draw.back).toBe('none');
  });

  it('PUBLIC draws a (size-4) circle at (+2,+2) carrying the background color', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PUBLIC_METHOD.getUDrawable(8, '#038048', '#84BE84').drawU(ug);
    const draw = drawAt(ug.events, 0);
    expect(draw.shape).toBeInstanceOf(UEllipse);
    expect((draw.shape as UEllipse).getWidth()).toBe(4);
    expect((draw.shape as UEllipse).getHeight()).toBe(4);
    expect([draw.dx, draw.dy]).toEqual([2, 2]);
    expect(draw.fore).toBe('#038048');
    expect(draw.back).toBe('#84BE84');
  });

  it('IE_MANDATORY draws a circle', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.IE_MANDATORY.getUDrawable(8, '#000000', '#000000').drawU(ug);
    expect(drawAt(ug.events, 0).shape).toBeInstanceOf(UEllipse);
  });

  it('PROTECTED draws the diamond polygon at (+1,+0)', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PROTECTED_METHOD.getUDrawable(8, '#B38D22', '#FFFF44').drawU(ug);
    const draw = drawAt(ug.events, 0);
    expect(draw.shape).toBeInstanceOf(UPolygon);
    // size 8 -> ensureEven 8 -> diamond over size-2 = 6.
    expect((draw.shape as UPolygon).getPoints()).toEqual([
      { x: 3, y: 0 },
      { x: 6, y: 3 },
      { x: 3, y: 6 },
      { x: 0, y: 3 },
    ]);
    expect([draw.dx, draw.dy]).toEqual([1, 0]);
  });

  it('PACKAGE_PRIVATE draws the triangle polygon at (+1,+0)', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PACKAGE_PRIVATE_FIELD.getUDrawable(8, '#1963A0', null).drawU(ug);
    const draw = drawAt(ug.events, 0);
    expect(draw.shape).toBeInstanceOf(UPolygon);
    expect((draw.shape as UPolygon).getPoints()).toEqual([
      { x: 3, y: 1 },
      { x: 0, y: 5 },
      { x: 6, y: 5 },
    ]);
    expect([draw.dx, draw.dy]).toEqual([1, 0]);
  });

  it('odd sizes are rounded down to even before drawing (ensureEven)', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PRIVATE_FIELD.getUDrawable(9, '#C82930', null).drawU(ug);
    const draw = drawAt(ug.events, 0);
    expect((draw.shape as URectangle).getWidth()).toBe(4); // 9 -> 8; 8-4=4
  });

  it('getUBlock sizes to (size+1, size+1)', () => {
    const block = VisibilityModifier.PUBLIC_FIELD.getUBlock(8, '#038048', null, false);
    const dim = block.calculateDimension({ calculateDimension: () => new XDimension2D(0, 0) });
    expect(dim.getWidth()).toBe(9);
    expect(dim.getHeight()).toBe(9);
  });

  it('getUBlock with the invisible rectangle draws a none-colored 2size x size rect first', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PUBLIC_FIELD.getUBlock(8, '#038048', null, true).drawU(ug);
    const rect = drawAt(ug.events, 0);
    expect(rect.shape).toBeInstanceOf(URectangle);
    expect((rect.shape as URectangle).getWidth()).toBe(16);
    expect((rect.shape as URectangle).getHeight()).toBe(8);
    expect(rect.fore).toBe('none');
    // The icon itself is still drawn (inside the group).
    expect(drawAt(ug.events, 1).shape).toBeInstanceOf(UEllipse);
  });

  it('getUBlock without the invisible rectangle draws only the icon', () => {
    const ug = new RecordingUGraphic();
    VisibilityModifier.PUBLIC_FIELD.getUBlock(8, '#038048', null, false).drawU(ug);
    expect(drawEvents(ug.events)).toHaveLength(1);
  });

  it('throws when the UGraphic cannot start groups', () => {
    expect(() =>
      VisibilityModifier.PRIVATE_FIELD.getUDrawable(8, '#C82930', null).drawU(new GrouplessUGraphic()),
    ).toThrow(/startGroup/);
  });
});
