import { LayoutBlock, PageSettings } from '../models/content-block.model';

export type NudgeDirection = 'left' | 'right' | 'up' | 'down';

export interface PositionedLayout {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getColWidth(page: PageSettings): number {
  return (page.widthPx - Math.max(0, page.gridCols - 1) * page.gapPx) / page.gridCols;
}

export function getGridUnitX(page: PageSettings): number {
  return getColWidth(page) + page.gapPx;
}

export function getGridUnitY(page: PageSettings): number {
  return page.rowHeightPx + page.gapPx;
}

export function getMaxRows(page: PageSettings): number {
  return Math.max(1, Math.floor((page.heightPx + page.gapPx) / getGridUnitY(page)));
}

export function normalizeLayout(layout: LayoutBlock, page: PageSettings): LayoutBlock {
  const width = Math.max(1, Math.min(page.gridCols, Math.round(layout.w)));
  const x = Math.max(0, Math.min(page.gridCols - width, Math.round(layout.x)));
  const maxRows = getMaxRows(page);
  const height = Math.max(1, Math.min(maxRows, Math.round(layout.h)));
  const y = Math.max(0, Math.min(maxRows - height, Math.round(layout.y)));

  return {
    ...layout,
    x,
    y,
    w: width,
    h: height,
    zIndex: Math.max(0, Math.round(layout.zIndex ?? 0)),
    locked: layout.locked ?? false,
    hidden: layout.hidden ?? false,
  };
}

export function layoutsOverlap(a: LayoutBlock, b: LayoutBlock): boolean {
  const aRight = a.x + a.w;
  const bRight = b.x + b.w;
  const aBottom = a.y + a.h;
  const bBottom = b.y + b.h;

  return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;
}

export function hasCollision(candidate: LayoutBlock, layouts: LayoutBlock[]): boolean {
  return layouts.some((layout) => {
    if (layout.id === candidate.id || layout.hidden) return false;
    return layoutsOverlap(candidate, layout);
  });
}

export function getPositionedLayout(layout: LayoutBlock, page: PageSettings): PositionedLayout {
  const colWidth = getColWidth(page);

  return {
    left: layout.x * getGridUnitX(page),
    top: layout.y * getGridUnitY(page),
    width: layout.w * colWidth + Math.max(0, layout.w - 1) * page.gapPx,
    height: layout.h * page.rowHeightPx + Math.max(0, layout.h - 1) * page.gapPx,
  };
}

export function getNudgedLayout(
  layout: LayoutBlock,
  direction: NudgeDirection,
  step: number,
  page: PageSettings
): LayoutBlock {
  const offset = Math.max(1, Math.round(step));
  switch (direction) {
    case 'left':
      return normalizeLayout({ ...layout, x: layout.x - offset }, page);
    case 'right':
      return normalizeLayout({ ...layout, x: layout.x + offset }, page);
    case 'up':
      return normalizeLayout({ ...layout, y: layout.y - offset }, page);
    case 'down':
      return normalizeLayout({ ...layout, y: layout.y + offset }, page);
  }
}
