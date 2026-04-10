# Roadmap

This document tracks the next meaningful improvements for the page layout editor after the current foundation work.

## Current Focus

- Undo/redo history for document edits
- Live collision feedback during drag and resize

## Next Up

### Browser-Level Interaction Smoke Tests

Add a small browser-level automation layer for the highest-value interaction paths.

Recommended initial coverage:
- drag into collision shows invalid outline
- resize into collision shows invalid outline
- undo and redo visibly change layout state

This should stay intentionally small and focus on smoke coverage rather than broad end-to-end scripting.

### Resize Constraints

Add stronger layout constraints to `LayoutBlock` so block resizing respects minimum and maximum usable sizes.

Likely additions:
- `minW`
- `minH`
- `maxW`
- `maxH`

Potential follow-up:
- schema-driven defaults by block type
- different resize rules for image, text, and question blocks

### Editor Focus Semantics

Keyboard nudging works, but focus is still mostly implicit.

Improvements:
- auto-focus the canvas when a block is selected
- clearer visual indication that keyboard controls are active
- avoid conflicts between editor shortcuts and property-panel text inputs

### Document Validation And Migration

The JSON contract is now meaningful enough that it should be versioned and validated more explicitly.

Additions:
- document version field
- stronger validation errors during import
- migration helpers for older persisted layouts
- block-level error reporting tied to `id`

### Block Registry Extensibility

The current block schema setup works, but a more formal registry would make reuse easier.

Desired registry responsibilities:
- schema
- default content
- default layout
- renderer
- optional custom property editor

This becomes more important if the editor is extracted into a reusable library or internal package.

### Multi-Page / Overflow Strategy

The editor currently grows page height when new content needs more space.

Potential future directions:
- explicit page breaks
- multi-page document model
- overflow indicators
- per-page layout validation

This only becomes necessary if the product wants true print/page authoring rather than a single expandable surface.
