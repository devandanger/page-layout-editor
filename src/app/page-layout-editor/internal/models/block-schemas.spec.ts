import { describe, expect, it } from 'vitest';
import { BlockRegistry, SerializedPageDocument } from './content-block.model';
import {
  hydrateDocument,
  serializeDocument,
  TEXT_SCHEMA,
  validateSerializedDocument,
} from './block-schemas';

describe('block schema helpers', () => {
  it('hydrates a serialized document through the provided registry', () => {
    const registry: BlockRegistry = {
      note: {
        type: 'note',
        label: 'Note',
        schema: TEXT_SCHEMA,
        createDefaultContent: () => ({ content: 'Default note' }),
        createDefaultLayout: () => ({ w: 5, h: 3 }),
      },
    };

    const serialized: SerializedPageDocument = {
      version: 1,
      blocks: [
        {
          id: 'block-note',
          blockType: 'note',
          data: { content: 'Hydrated note' },
        },
      ],
      layout: [{ blockId: 'block-note' }],
      page: {},
    };

    const hydrated = hydrateDocument(serialized, registry);

    expect(hydrated.blocks[0]).toMatchObject({
      id: 'block-note',
      blockType: 'note',
      schema: TEXT_SCHEMA,
      data: { content: 'Hydrated note' },
    });
    expect(hydrated.layout[0]).toMatchObject({
      blockId: 'block-note',
      w: 12,
      h: 3,
    });
  });

  it('serializes a runtime page document without schema metadata', () => {
    const document = hydrateDocument(
      {
        version: 1,
        blocks: [{ id: 'block-note', blockType: 'note', data: { content: 'Serializable' } }],
        layout: [{ id: 'layout-note', blockId: 'block-note', x: 1, y: 2, w: 5, h: 3 }],
        page: {},
      },
      {
        note: {
          type: 'note',
          label: 'Note',
          schema: TEXT_SCHEMA,
          createDefaultContent: () => ({ content: 'Default note' }),
          createDefaultLayout: () => ({ w: 5, h: 3 }),
        },
      }
    );

    const serialized = serializeDocument(document);

    expect(serialized.blocks[0]).toEqual({
      id: 'block-note',
      blockType: 'note',
      data: { content: 'Serializable' },
    });
    expect('schema' in serialized.blocks[0]).toBe(false);
    expect(serialized.layout[0]).toMatchObject({ blockId: 'block-note', w: 5, h: 3 });
  });

  it('validates supported serialized documents', () => {
    const registry: BlockRegistry = {
      note: {
        type: 'note',
        label: 'Note',
        schema: TEXT_SCHEMA,
        createDefaultContent: () => ({ content: 'Default note' }),
        createDefaultLayout: () => ({ w: 5, h: 3 }),
      },
    };

    const result = validateSerializedDocument(
      {
        version: 1,
        blocks: [{ id: 'block-note', blockType: 'note', data: { content: 'Valid' } }],
        layout: [{ id: 'layout-note', blockId: 'block-note', x: 0, y: 0, w: 5, h: 3 }],
        page: {},
      },
      registry
    );

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('reports unsupported document versions and unknown block types', () => {
    const result = validateSerializedDocument(
      {
        version: 99,
        blocks: [{ id: 'block-note', blockType: 'missing', data: {} }],
        layout: [],
        page: {},
      },
      {}
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unsupported document version: 99.');
    expect(result.errors).toContain('Block "block-note" uses unknown blockType "missing".');
  });

  it('reports layout records that reference missing blocks', () => {
    const registry: BlockRegistry = {
      note: {
        type: 'note',
        label: 'Note',
        schema: TEXT_SCHEMA,
        createDefaultContent: () => ({ content: 'Default note' }),
      },
    };

    const result = validateSerializedDocument(
      {
        version: 1,
        blocks: [{ id: 'block-note', blockType: 'note', data: {} }],
        layout: [{ id: 'layout-missing', blockId: 'block-missing', x: 0, y: 0, w: 5, h: 3 }],
        page: {},
      },
      registry
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Layout at index 0 references unknown blockId "block-missing".');
  });

  it('throws a combined validation error before hydration', () => {
    expect(() =>
      hydrateDocument(
        {
          version: 2,
          blocks: [{ id: 'block-note', blockType: 'missing', data: {} }],
          layout: [],
          page: {},
        },
        {}
      )
    ).toThrow('Invalid page document: Unsupported document version: 2. Block "block-note" uses unknown blockType "missing".');
  });
});
