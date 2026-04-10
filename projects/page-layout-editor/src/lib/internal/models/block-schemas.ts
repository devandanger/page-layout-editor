import {
  BlockDefinition,
  BlockRegistry,
  BlockSchema,
  BlockTypeOption,
  ContentBlock,
  DocumentValidationResult,
  LayoutBlock,
  PageDocument,
  PageSettings,
  SerializedContentBlock,
  SerializedPageDocument,
} from './content-block.model';

export const CURRENT_DOCUMENT_VERSION = 1;

let nextId = 1;

export function createId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

// --- Schema Definitions ---

export const IMAGE_SCHEMA: BlockSchema = {
  typeLabel: 'Image',
  icon: '\u{1F5BC}',
  properties: [
    { key: 'src', label: 'Image URL', type: 'url', placeholder: 'https://...' },
    { key: 'alt', label: 'Alt Text', type: 'text', placeholder: 'Describe the image' },
    { key: 'objectFit', label: 'Object Fit', type: 'select', options: [
      { label: 'Contain', value: 'contain' },
      { label: 'Cover', value: 'cover' },
      { label: 'Fill', value: 'fill' },
      { label: 'None', value: 'none' },
    ]},
    { key: 'borderRadius', label: 'Border Radius (px)', type: 'number', min: 0, max: 100 },
  ],
};

export const TEXT_SCHEMA: BlockSchema = {
  typeLabel: 'Text',
  icon: '\u{1F4DD}',
  properties: [
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Enter text...' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 72 },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: [
      { label: 'Normal', value: 'normal' },
      { label: 'Bold', value: 'bold' },
      { label: 'Light', value: '300' },
    ]},
    { key: 'textAlign', label: 'Text Align', type: 'select', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
      { label: 'Justify', value: 'justify' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
  ],
};

// --- Default Block Instances ---

export function createDefaultImageBlock(): ContentBlock {
  return {
    id: createId('block'),
    blockType: 'image',
    schema: IMAGE_SCHEMA,
    data: {
      src: 'https://picsum.photos/seed/mathpage/600/400',
      alt: 'Sample math worksheet header image',
      objectFit: 'contain',
      borderRadius: 4,
      backgroundColor: '#e8f5e9',
    },
  };
}

export function createDefaultTextBlock(): ContentBlock {
  return {
    id: createId('block'),
    blockType: 'text',
    schema: TEXT_SCHEMA,
    data: {
      content:
        'Complete each of the following math problems using the top-down method. ' +
        'Show your work vertically, writing each step below the previous one. ' +
        'Circle your final answer. You have 30 minutes to complete this worksheet.',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left',
      backgroundColor: '#ffffff',
    },
  };
}

// Schema registry — lookup by blockType
export const SCHEMA_REGISTRY: Record<string, BlockSchema> = {
  image: IMAGE_SCHEMA,
  text: TEXT_SCHEMA,
};

export const DEFAULT_BLOCK_REGISTRY: BlockRegistry = {
  image: {
    type: 'image',
    label: IMAGE_SCHEMA.typeLabel,
    icon: IMAGE_SCHEMA.icon,
    schema: IMAGE_SCHEMA,
    renderKind: 'image',
    createDefaultContent: () => structuredClone(createDefaultImageBlock().data),
    createDefaultLayout: () => ({ w: 12, h: 6 }),
  },
  text: {
    type: 'text',
    label: TEXT_SCHEMA.typeLabel,
    icon: TEXT_SCHEMA.icon,
    schema: TEXT_SCHEMA,
    renderKind: 'text',
    createDefaultContent: () => structuredClone(createDefaultTextBlock().data),
    createDefaultLayout: () => ({ w: 12, h: 4 }),
  },
};

export function getBlockDefinition(registry: BlockRegistry, blockType: string): BlockDefinition {
  const definition = registry[blockType];
  if (!definition) {
    throw new Error(`Unknown blockType: "${blockType}"`);
  }

  return definition;
}

export function getBlockTypeOptions(registry: BlockRegistry): BlockTypeOption[] {
  return Object.values(registry).map((definition) => ({
    blockType: definition.type,
    label: definition.label,
    icon: definition.icon,
  }));
}

export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = getBlockTypeOptions(DEFAULT_BLOCK_REGISTRY);

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  widthPx: 816,
  heightPx: 1056,
  gridCols: 12,
  rowHeightPx: 40,
  gapPx: 8,
};

export function getDefaultBlockHeight(blockType: string): number {
  switch (blockType) {
    case 'image':
      return 6;
    case 'text':
      return 4;
    default:
      return 4;
  }
}

export function createDefaultBlock(blockType: string): ContentBlock {
  const definition = getBlockDefinition(DEFAULT_BLOCK_REGISTRY, blockType);

  return {
    id: createId('block'),
    blockType: definition.type,
    schema: definition.schema,
    data: structuredClone(definition.createDefaultContent()),
  };
}

export function createLayoutBlock(
  block: ContentBlock,
  overrides: Partial<LayoutBlock> = {}
): LayoutBlock {
  return {
    id: createId('layout'),
    blockId: block.id,
    x: 0,
    y: 0,
    w: 12,
    h: getDefaultBlockHeight(block.blockType),
    locked: false,
    hidden: false,
    zIndex: 0,
    ...overrides,
  };
}

export function createDefaultLayout(blocks: ContentBlock[]): LayoutBlock[] {
  return blocks.map((block, index) =>
    createLayoutBlock(block, {
      y: index * 6,
      zIndex: index,
    })
  );
}

export function createDefaultDocument(): PageDocument {
  const blocks = [
    createDefaultImageBlock(),
    createDefaultTextBlock(),
  ];

  return {
    blocks,
    layout: createDefaultLayout(blocks),
    page: { ...DEFAULT_PAGE_SETTINGS },
  };
}

export function serializeDocument(document: PageDocument): SerializedPageDocument {
  return {
    version: CURRENT_DOCUMENT_VERSION,
    blocks: document.blocks.map((block) => ({
      id: block.id,
      blockType: block.blockType,
      data: structuredClone(block.data),
    })),
    layout: document.layout.map((layout) => structuredClone(layout)),
    page: structuredClone(document.page),
  };
}

export function validateSerializedDocument(
  input: unknown,
  registry: BlockRegistry
): DocumentValidationResult {
  const errors: string[] = [];

  if (Array.isArray(input)) {
    validateSerializedBlocks(input, registry, errors);
    return { valid: errors.length === 0, errors };
  }

  if (!isRecord(input)) {
    return { valid: false, errors: ['Document must be an object or a legacy block array.'] };
  }

  const version = input['version'];
  if (version !== undefined && version !== CURRENT_DOCUMENT_VERSION) {
    errors.push(`Unsupported document version: ${String(version)}.`);
  }

  const blocks = input['blocks'];
  if (!Array.isArray(blocks)) {
    errors.push('Document must include a blocks array.');
  } else {
    validateSerializedBlocks(blocks, registry, errors);
  }

  const layout = input['layout'];
  if (layout !== undefined && !Array.isArray(layout)) {
    errors.push('Document layout must be an array when provided.');
  }

  if (Array.isArray(blocks) && Array.isArray(layout)) {
    validateSerializedLayout(layout, new Set(blocks.map((block) => getRecordString(block, 'id'))), errors);
  }

  const page = input['page'];
  if (page !== undefined && !isRecord(page)) {
    errors.push('Document page must be an object when provided.');
  }

  return { valid: errors.length === 0, errors };
}

export function hydrateBlocks(
  blocks: SerializedContentBlock[],
  registry: BlockRegistry
): ContentBlock[] {
  return blocks.map((entry) => {
    const definition = getBlockDefinition(registry, entry.blockType);
    return {
      id: entry.id ?? createId('block'),
      blockType: definition.type,
      schema: definition.schema,
      data: structuredClone(entry.data),
    };
  });
}

export function hydrateDocument(
  input: SerializedPageDocument | SerializedContentBlock[],
  registry: BlockRegistry,
  fallbackPage: PageSettings = DEFAULT_PAGE_SETTINGS
): PageDocument {
  const validation = validateSerializedDocument(input, registry);
  if (!validation.valid) {
    throw new Error(`Invalid page document: ${validation.errors.join(' ')}`);
  }

  const parsedBlocks = Array.isArray(input) ? input : (input.blocks ?? []);
  const blocks = hydrateBlocks(parsedBlocks, registry);
  const parsedLayout = Array.isArray(input) ? [] : (input.layout ?? []);

  const layout = blocks.map((block, index) => {
    const existing = parsedLayout.find((item) => item.blockId === block.id);
    const defaultHeight = registry[block.blockType]?.createDefaultLayout?.().h ?? getDefaultBlockHeight(block.blockType);
    return {
      id: existing?.id ?? createId('layout'),
      blockId: block.id,
      x: Math.max(0, Math.round(existing?.x ?? 0)),
      y: Math.max(0, Math.round(existing?.y ?? index * 6)),
      w: Math.max(1, Math.round(existing?.w ?? 12)),
      h: Math.max(1, Math.round(existing?.h ?? defaultHeight)),
      locked: existing?.locked ?? false,
      hidden: existing?.hidden ?? false,
      zIndex: Math.max(0, Math.round(existing?.zIndex ?? index)),
    };
  });

  return {
    blocks,
    layout,
    page: {
      ...fallbackPage,
      ...(Array.isArray(input) ? {} : input.page),
    },
  };
}

function validateSerializedBlocks(
  blocks: unknown[],
  registry: BlockRegistry,
  errors: string[]
): void {
  blocks.forEach((block, index) => {
    if (!isRecord(block)) {
      errors.push(`Block at index ${index} must be an object.`);
      return;
    }

    const id = block['id'];
    const blockType = block['blockType'];
    const data = block['data'];

    if (typeof id !== 'string' || !id.trim()) {
      errors.push(`Block at index ${index} must include a non-empty id.`);
    }

    if (typeof blockType !== 'string' || !blockType.trim()) {
      errors.push(`Block at index ${index} must include a non-empty blockType.`);
    } else if (!registry[blockType]) {
      errors.push(`Block "${String(id || index)}" uses unknown blockType "${blockType}".`);
    }

    if (!isRecord(data)) {
      errors.push(`Block "${String(id || index)}" data must be an object.`);
    }
  });
}

function validateSerializedLayout(
  layout: unknown[],
  blockIds: Set<string | undefined>,
  errors: string[]
): void {
  layout.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Layout at index ${index} must be an object.`);
      return;
    }

    const blockId = item['blockId'];
    if (typeof blockId !== 'string' || !blockId.trim()) {
      errors.push(`Layout at index ${index} must include a non-empty blockId.`);
    } else if (!blockIds.has(blockId)) {
      errors.push(`Layout at index ${index} references unknown blockId "${blockId}".`);
    }

    for (const key of ['x', 'y', 'w', 'h', 'zIndex'] as const) {
      const value = item[key];
      if (value !== undefined && (!Number.isFinite(value) || typeof value !== 'number')) {
        errors.push(`Layout "${String(blockId || index)}" property "${key}" must be a finite number.`);
      }
    }

    for (const key of ['locked', 'hidden'] as const) {
      const value = item[key];
      if (value !== undefined && typeof value !== 'boolean') {
        errors.push(`Layout "${String(blockId || index)}" property "${key}" must be a boolean.`);
      }
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecordString(value: unknown, key: string): string | undefined {
  return isRecord(value) && typeof value[key] === 'string' ? value[key] : undefined;
}
