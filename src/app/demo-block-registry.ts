import {
  BlockRegistry,
  BlockSchema,
  createDefaultDocument,
  DEFAULT_BLOCK_REGISTRY,
  PageDocument,
} from 'page-layout-editor';

export const QUESTIONS_SCHEMA: BlockSchema = {
  typeLabel: 'Questions',
  icon: '\u{2753}',
  properties: [
    { key: 'columns', label: 'Grid Columns', type: 'number', min: 1, max: 6 },
    { key: 'showAnswers', label: 'Show Answers', type: 'boolean' },
    {
      key: 'questions',
      label: 'Questions',
      type: 'array',
      itemSchema: [
        { key: 'question', label: 'Question', type: 'text', placeholder: 'e.g. 345 + 278' },
        { key: 'answer', label: 'Answer', type: 'text', placeholder: 'e.g. 623' },
        {
          key: 'questionType',
          label: 'Type',
          type: 'select',
          options: [
            { label: 'Math Top-Down', value: 'math-top-down' },
            { label: 'Math Left-Right', value: 'math-left-right' },
            { label: 'Multiple Choice', value: 'multiple-choice' },
            { label: 'Fill in Blank', value: 'fill-in-blank' },
          ],
        },
      ],
      itemDefault: { question: '', answer: '', questionType: 'math-top-down' },
    },
  ],
};

const defaultQuestionsContent = {
  columns: 2,
  showAnswers: true,
  questions: [
    { question: '345 + 278', answer: '623', questionType: 'math-top-down' },
    { question: '512 - 187', answer: '325', questionType: 'math-top-down' },
    { question: '64 \u00d7 7', answer: '448', questionType: 'math-top-down' },
    { question: '936 \u00f7 4', answer: '234', questionType: 'math-top-down' },
    { question: '1,024 + 879', answer: '1,903', questionType: 'math-top-down' },
    { question: '800 - 356', answer: '444', questionType: 'math-top-down' },
    { question: '123 \u00d7 5', answer: '615', questionType: 'math-top-down' },
    { question: '756 \u00f7 3', answer: '252', questionType: 'math-top-down' },
    { question: '2,450 + 1,375', answer: '3,825', questionType: 'math-top-down' },
    { question: '999 - 467', answer: '532', questionType: 'math-top-down' },
  ],
};

export const DEMO_BLOCK_REGISTRY: BlockRegistry = {
  ...DEFAULT_BLOCK_REGISTRY,
  questions: {
    type: 'questions',
    label: QUESTIONS_SCHEMA.typeLabel,
    icon: QUESTIONS_SCHEMA.icon,
    schema: QUESTIONS_SCHEMA,
    renderKind: 'list-grid',
    createDefaultContent: () => structuredClone(defaultQuestionsContent),
    createDefaultLayout: () => ({ w: 12, h: 8 }),
  },
};

export function createDemoDocument(): PageDocument {
  const document = structuredClone(createDefaultDocument());
  const blockId = 'demo-questions-block';

  return {
    ...document,
    blocks: [
      ...document.blocks,
      {
        id: blockId,
        blockType: 'questions',
        schema: QUESTIONS_SCHEMA,
        data: structuredClone(defaultQuestionsContent),
      },
    ],
    layout: [
      ...document.layout,
      {
        id: 'demo-questions-layout',
        blockId,
        x: 0,
        y: 12,
        w: 12,
        h: 8,
        locked: false,
        hidden: false,
        zIndex: document.layout.length,
      },
    ],
  };
}
