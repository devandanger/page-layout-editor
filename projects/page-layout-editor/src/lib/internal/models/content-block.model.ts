import type { Type } from '@angular/core';

// --- Property Schema ---
// Each block type declares its editable properties via a schema.
// The property panel renders controls dynamically from this.

export type PropType =
  | 'text'       // single-line input
  | 'textarea'   // multi-line
  | 'number'     // numeric input
  | 'url'        // URL input (renders preview for images)
  | 'select'     // dropdown
  | 'color'      // color picker
  | 'boolean'    // checkbox/toggle
  | 'array';     // repeatable group of sub-properties

export interface PropOption {
  label: string;
  value: string;
}

export interface PropDef {
  key: string;           // property path on the block's `data` object
  label: string;         // display label
  type: PropType;
  placeholder?: string;
  options?: PropOption[]; // for 'select' type
  min?: number;           // for 'number' type
  max?: number;
  /** For 'array' type: schema for each item in the array */
  itemSchema?: PropDef[];
  /** For 'array' type: factory to create a new default item */
  itemDefault?: Record<string, any>;
}

export interface BlockSchema {
  typeLabel: string;     // e.g. "Image", "Text", "Questions"
  icon?: string;         // optional icon character
  properties: PropDef[];
}

export interface BlockTypeOption {
  blockType: string;
  label: string;
  icon?: string;
}

export interface ContentBlock {
  id: string;
  blockType: string;
  schema: BlockSchema;
  data: Record<string, unknown>;
}

export interface LayoutBlock {
  id: string;
  blockId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

export interface PageSize {
  widthPx: number;
  heightPx: number;
}

export interface PageSettings extends PageSize {
  gridCols: number;
  rowHeightPx: number;
  gapPx: number;
}

export interface PageDocument {
  blocks: ContentBlock[];
  layout: LayoutBlock[];
  page: PageSettings;
}

export interface SerializedContentBlock {
  id: string;
  blockType: string;
  data: Record<string, unknown>;
}

export interface SerializedPageDocument {
  version?: number;
  blocks: SerializedContentBlock[];
  layout: Array<Partial<LayoutBlock>>;
  page: Partial<PageSettings>;
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
}

export type BuiltInBlockRenderKind = 'image' | 'text' | 'list-grid' | 'json';

export type BlockRenderKind = BuiltInBlockRenderKind | (string & {});

export interface BlockDefinition {
  type: string;
  label: string;
  icon?: string;
  schema: BlockSchema;
  renderKind?: BlockRenderKind;
  createDefaultContent(): Record<string, unknown>;
  createDefaultLayout?(): Partial<LayoutBlock>;
}

export type BlockRegistry = Record<string, BlockDefinition>;

export interface BlockRendererContext {
  block: ContentBlock;
  layout: LayoutBlock;
  selected: boolean;
  readonly: boolean;
}

export interface BlockRendererDefinition {
  component: Type<unknown>;
  printAdapter?: (context: BlockRendererContext) => {
    html: string;
    css?: string;
  };
}

export type BlockRendererRegistry = Record<string, BlockRendererDefinition>;

export interface EditorTheme {
  accentColor?: string;
  sidebarWidthPx?: number;
  propertyPanelWidthPx?: number;
}

export interface PageLayoutEditorFeatures {
  addBlocks?: boolean;
  duplicateBlocks?: boolean;
  deleteBlocks?: boolean;
  printPreview?: boolean;
  keyboardNudge?: boolean;
  resize?: boolean;
  drag?: boolean;
}

export interface PageLayoutEditorConfig {
  readonly?: boolean;
  historyLimit?: number;
  features?: PageLayoutEditorFeatures;
}

export type ResolvedPageLayoutEditorConfig = Required<Omit<PageLayoutEditorConfig, 'features'>> & {
  features: Required<PageLayoutEditorFeatures>;
};

export type EditorActionType =
  | 'select'
  | 'add-block'
  | 'duplicate-block'
  | 'delete-block'
  | 'toggle-hidden'
  | 'toggle-locked'
  | 'bring-forward'
  | 'send-backward'
  | 'undo'
  | 'redo'
  | 'print-preview'
  | 'back';

export interface EditorAction {
  type: EditorActionType;
  blockId?: string | null;
  blockType?: string;
}

export interface LayoutPropDef {
  key: keyof Pick<LayoutBlock, 'x' | 'y' | 'w' | 'h' | 'zIndex' | 'locked' | 'hidden'>;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
}

export const LAYOUT_PROPERTIES: LayoutPropDef[] = [
  { key: 'x', label: 'Column', type: 'number', min: 0, max: 99 },
  { key: 'y', label: 'Row', type: 'number', min: 0, max: 999 },
  { key: 'w', label: 'Width', type: 'number', min: 1, max: 99 },
  { key: 'h', label: 'Height', type: 'number', min: 1, max: 999 },
  { key: 'zIndex', label: 'Layer Order', type: 'number', min: 0, max: 999 },
  { key: 'locked', label: 'Locked', type: 'boolean' },
  { key: 'hidden', label: 'Hidden', type: 'boolean' },
];
