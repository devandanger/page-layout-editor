# BLOCK_SCHEME_LAYOUT_BLOCK_DESIGN

This document defines the high-level JSON intermediate format, the runtime mapping into `ContentBlock` and `LayoutBlock`, and the next enhancement steps for both block schemas and layout records.

## Purpose

The editor needs two separate models:

- content semantics
- page layout semantics

Those are represented as:

- `ContentBlock`: what a block contains
- `LayoutBlock`: where that block is placed and how large it is

The persisted JSON is intentionally editor-neutral. Angular runtime metadata such as `schema` is re-attached after parsing.

## Intermediate JSON Format

The persisted document shape is:

```json
{
  "blocks": [
    {
      "id": "block-1",
      "blockType": "image",
      "data": {
        "src": "https://picsum.photos/seed/mathpage/600/400",
        "alt": "Sample math worksheet header image",
        "objectFit": "contain",
        "borderRadius": 4,
        "backgroundColor": "#e8f5e9"
      }
    },
    {
      "id": "block-2",
      "blockType": "text",
      "data": {
        "content": "Instructions go here",
        "fontSize": 14,
        "fontWeight": "normal",
        "textAlign": "left",
        "backgroundColor": "#fff3e0"
      }
    },
    {
      "id": "block-3",
      "blockType": "questions",
      "data": {
        "columns": 2,
        "showAnswers": true,
        "questions": [
          {
            "question": "345 + 278",
            "answer": "623",
            "questionType": "math-top-down"
          }
        ]
      }
    }
  ],
  "layout": [
    {
      "id": "layout-1",
      "blockId": "block-1",
      "x": 0,
      "y": 0,
      "w": 12,
      "h": 6,
      "locked": false,
      "hidden": false,
      "zIndex": 0
    },
    {
      "id": "layout-2",
      "blockId": "block-2",
      "x": 0,
      "y": 6,
      "w": 12,
      "h": 4,
      "locked": false,
      "hidden": false,
      "zIndex": 1
    },
    {
      "id": "layout-3",
      "blockId": "block-3",
      "x": 0,
      "y": 10,
      "w": 12,
      "h": 8,
      "locked": false,
      "hidden": false,
      "zIndex": 2
    }
  ],
  "page": {
    "widthPx": 816,
    "heightPx": 1056,
    "gridCols": 12,
    "rowHeightPx": 40,
    "gapPx": 8
  }
}
```

## Runtime Types

At runtime, the editor resolves the persisted JSON into these types:

```ts
type ContentBlock = {
  id: string;
  blockType: string;
  schema: BlockSchema;
  data: Record<string, unknown>;
};

type LayoutBlock = {
  id: string;
  blockId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
};

type PageSettings = {
  widthPx: number;
  heightPx: number;
  gridCols: number;
  rowHeightPx: number;
  gapPx: number;
};
```

## Semantics

### `blocks`

`blocks` is the source of truth for content.

Rules:

- `id` must be stable and unique
- `blockType` must map to a registered schema
- `data` holds only block-specific content values
- `data` must not contain layout values like `x`, `y`, `w`, `h`

Examples of content properties:

- image URL
- alt text
- text body
- questions array
- block-specific styling such as font size or object fit

### `layout`

`layout` is the source of truth for placement.

Rules:

- `blockId` must reference an existing block
- one visible block should normally have one layout record
- `x`, `y`, `w`, `h` are grid units, not pixels
- `locked` controls interaction
- `hidden` controls visibility and print inclusion
- `zIndex` controls overlap order when overlap is allowed

These fields are intentionally editor-wide and not block-specific.

### `page`

`page` defines the layout system used to interpret `layout`.

Rules:

- `widthPx` and `heightPx` define the document surface
- `gridCols` defines the horizontal grid
- `rowHeightPx` defines the vertical grid unit
- `gapPx` defines spacing between cells

All layout math derives from `page`.

## Mapping Rule

The editor renders by joining block content to layout records:

```ts
type PositionedBlock = {
  block: ContentBlock;
  layout: LayoutBlock;
};
```

Join condition:

```ts
layout.blockId === block.id
```

Pixel math:

```ts
left = x * (colWidth + gapPx)
top = y * (rowHeightPx + gapPx)
width = w * colWidth + (w - 1) * gapPx
height = h * rowHeightPx + (h - 1) * gapPx
```

## Property Panel Design

The property panel should stay split into two sections:

### Content

Schema-driven controls from `BlockSchema.properties`.

This section edits:

- `ContentBlock.data`

This section should contain:

- text fields
- textareas
- selects
- colors
- booleans
- arrays
- future rich content controls

### Layout

Shared layout controls for every block.

This section edits:

- `LayoutBlock`

Current layout controls:

- `x`
- `y`
- `w`
- `h`
- `zIndex`
- `locked`
- `hidden`

This separation keeps schema design focused on block meaning and layout design focused on editor placement.

## Block Schema Design

The current block schema system is appropriate for configurable block content.

Current responsibilities:

- define editable content fields
- define labels and editor control types
- define per-block defaults

Current schema extension workflow:

1. create a new schema in `src/app/models/block-schemas.ts`
2. create a default block factory for that schema
3. register the schema in `SCHEMA_REGISTRY`
4. add render logic in the editor
5. add print render logic

Recommended future enhancements for block schemas:

### Step 1: Validation Metadata

Add field-level validation such as:

- required
- min/max
- regex
- allowed values
- custom validator hooks

Work required:

- extend `PropDef`
- validate on JSON import
- display errors in the property panel and JSON editor

### Step 2: Richer Field Types

Add more expressive schema field types:

- `richtext`
- `image-upload`
- `object`
- `group`
- `date`
- `markdown`

Work required:

- extend the property panel renderer
- define defaults and serialization rules
- add validators for each new field type

### Step 3: Conditional Fields

Support properties that appear only when another field has a specific value.

Examples:

- show image crop mode only for image blocks
- show answer formatting only when answers are enabled

Work required:

- add visibility rules to `PropDef`
- evaluate those rules in the property panel

### Step 4: Schema Versioning

Allow schemas to evolve without breaking saved documents.

Work required:

- add block-level version metadata
- define migrations
- apply migrations on import

## Layout Block Design

The current `LayoutBlock` is the minimum viable shape for a grid-based editor.

Current responsibilities:

- identify the target block
- store page position
- store size
- store visibility/locking/stacking state

Recommended future enhancements for layout blocks:

### Step 1: Constraints

Add:

- `minW`
- `minH`
- `maxW`
- `maxH`

Work required:

- extend the layout type
- enforce constraints in the property panel
- enforce constraints during drag/resize

### Step 2: Collision Policy

Define overlap behavior.

Possible policies:

- reject overlap
- allow overlap
- push blocks downward

Work required:

- implement collision detection
- define policy in the layout service
- keep print ordering consistent

### Step 3: Resize Support

Add interactive resizing.

Work required:

- render resize handles
- update `w` and `h` during pointer interaction
- clamp to page bounds and layout constraints

### Step 4: Nested Layout

Allow containers, sections, or columns to own child blocks.

Add:

- `parentId`
- local coordinate semantics

Work required:

- build a layout tree
- render nested coordinate systems
- update selection and drag logic

### Step 5: Multi-Page Support

Allow a document to span multiple pages.

Add:

- `pageId`

Work required:

- define page collection structure
- update print rendering and page navigation
- update editor UI for page switching

### Step 6: Responsive Variants

Support alternate layouts for different surfaces.

Add:

- breakpoint-aware layout records or variant groups

Work required:

- define inheritance/fallback rules
- add variant switching UI
- migrate old single-layout documents

## Recommended Development Order

The next steps should be implemented in this order:

1. add layout validation and normalization
2. add resize support
3. add collision handling
4. add schema validation metadata
5. add nested layout support
6. add schema and document migration/versioning
7. add responsive or multi-page variants if needed

## Practical Boundary

The most important rule to preserve is:

- `ContentBlock` owns meaning
- `LayoutBlock` owns placement

If a field answers “what is this block?”, it belongs in block schema or block data.

If a field answers “where is this block and how does it behave on the page?”, it belongs in the layout block.
