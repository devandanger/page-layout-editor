import { describe, expect, it } from 'vitest';
import { LayoutBlock, PageSettings } from '../models/content-block.model';
import {
  getNudgedLayout,
  getPositionedLayout,
  hasCollision,
  layoutsOverlap,
  normalizeLayout,
} from './layout-utils';

const page: PageSettings = {
  widthPx: 816,
  heightPx: 1056,
  gridCols: 12,
  rowHeightPx: 40,
  gapPx: 8,
};

function layout(overrides: Partial<LayoutBlock> = {}): LayoutBlock {
  return {
    id: 'layout-1',
    blockId: 'block-1',
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    locked: false,
    hidden: false,
    zIndex: 0,
    ...overrides,
  };
}

describe('layout-utils', () => {
  it('normalizes layout values to page bounds and defaults', () => {
    const normalized = normalizeLayout(
      layout({ x: 20, y: 999, w: 20, h: 999, zIndex: -5, locked: undefined, hidden: undefined }),
      page
    );

    expect(normalized).toMatchObject({
      x: 0,
      y: 0,
      w: 12,
      h: 22,
      zIndex: 0,
      locked: false,
      hidden: false,
    });
  });

  it('detects overlap and ignores hidden/self layouts when checking collisions', () => {
    const candidate = layout({ id: 'layout-a', blockId: 'block-a', x: 0, y: 0, w: 4, h: 4 });
    const overlapping = layout({ id: 'layout-b', blockId: 'block-b', x: 3, y: 2, w: 4, h: 4 });
    const hidden = layout({
      id: 'layout-c',
      blockId: 'block-c',
      x: 1,
      y: 1,
      w: 2,
      h: 2,
      hidden: true,
    });

    expect(layoutsOverlap(candidate, overlapping)).toBe(true);
    expect(hasCollision(candidate, [candidate, hidden, overlapping])).toBe(true);
    expect(hasCollision(candidate, [candidate, hidden])).toBe(false);
  });

  it('computes positioned pixel layout from grid units', () => {
    const positioned = getPositionedLayout(layout({ x: 2, y: 3, w: 2, h: 4 }), page);

    expect(positioned).toEqual({
      left: 137.33333333333331,
      top: 144,
      width: 129.33333333333331,
      height: 160 + 24,
    });
  });

  it('nudges layouts by grid units and clamps to bounds', () => {
    expect(getNudgedLayout(layout({ x: 2, y: 3 }), 'right', 1, page)).toMatchObject({ x: 3, y: 3 });
    expect(getNudgedLayout(layout({ x: 0, y: 3 }), 'left', 1, page)).toMatchObject({ x: 0, y: 3 });
    expect(getNudgedLayout(layout({ x: 2, y: 0 }), 'up', 4, page)).toMatchObject({ x: 2, y: 0 });
    expect(getNudgedLayout(layout({ x: 8, y: 3, w: 4 }), 'right', 3, page)).toMatchObject({ x: 8 });
  });
});
