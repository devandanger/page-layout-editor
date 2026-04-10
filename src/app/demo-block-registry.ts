import {
  BlockRegistry,
  BlockRendererContext,
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

export const CALLOUT_SCHEMA: BlockSchema = {
  typeLabel: 'Callout',
  icon: '\u{2726}',
  properties: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text', placeholder: 'e.g. Teacher Note' },
    { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Try A Different Strategy' },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Helpful supporting text for the worksheet.' },
    { key: 'accentColor', label: 'Accent Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
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

const defaultCalloutContent = {
  eyebrow: 'Teacher Note',
  title: 'Use A Number Line',
  body: 'Invite the learner to sketch a quick number line before solving the next three prompts.',
  accentColor: '#c62828',
  backgroundColor: '#fff8f2',
};

export function printDemoQuestionsRenderer(context: BlockRendererContext): { html: string; css?: string } {
  const data = context.block.data;
  const questions = Array.isArray(data['questions']) ? data['questions'] : [];
  const showAnswers = data['showAnswers'] !== false;
  const columns = Math.max(1, Number(data['columns'] ?? 2));
  const items = questions
    .map((item, index) => {
      const record = typeof item === 'object' && item ? (item as Record<string, unknown>) : {};
      const question = String(record['question'] ?? '');
      const answer = String(record['answer'] ?? '');
      return `<article class="demo-print-question-card">
        <div class="demo-print-question-row">
          <span class="demo-print-question-num">${index + 1}.</span>
          <span>${escapeHtml(question)}</span>
        </div>
        ${showAnswers && answer ? `<div class="demo-print-answer-row">Answer: ${escapeHtml(answer)}</div>` : ''}
      </article>`;
    })
    .join('');

  return {
    html: `<section class="demo-print-questions">
      <div class="demo-print-questions-header">
        <span class="demo-print-title">Worksheet Questions</span>
        <span class="demo-print-meta">${questions.length} prompts</span>
      </div>
      <div class="demo-print-questions-grid" style="grid-template-columns:repeat(${columns},1fr)">${items}</div>
    </section>`,
    css: `
      .demo-print-questions {
        height: 100%;
        padding: 16px;
        background: linear-gradient(160deg, #fffde7 0%, #ffffff 55%, #eef7ff 100%);
      }
      .demo-print-questions-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .demo-print-title {
        font-size: 15px;
        font-weight: 700;
        color: #234;
      }
      .demo-print-meta {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #607d8b;
        font-weight: 700;
      }
      .demo-print-questions-grid {
        display: grid;
        gap: 10px;
      }
      .demo-print-question-card {
        padding: 10px 12px;
        border: 1px solid rgba(35, 52, 68, 0.1);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.92);
      }
      .demo-print-question-row {
        display: flex;
        gap: 6px;
        font-size: 13px;
        line-height: 1.45;
        color: #1f2d3d;
      }
      .demo-print-question-num {
        font-weight: 700;
        color: #1565c0;
      }
      .demo-print-answer-row {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px dashed rgba(21, 101, 192, 0.18);
        font-size: 12px;
        color: #2e7d32;
        font-weight: 600;
      }
    `,
  };
}

export function printDemoCalloutRenderer(context: BlockRendererContext): { html: string; css?: string } {
  const data = context.block.data;
  const eyebrow = String(data['eyebrow'] ?? '');
  const title = String(data['title'] ?? '');
  const body = String(data['body'] ?? '');
  const accentColor = normalizeColor(data['accentColor'], '#c62828');
  const backgroundColor = normalizeColor(data['backgroundColor'], '#fff8f2');

  return {
    html: `<section class="demo-print-callout" style="--demo-callout-accent:${accentColor};--demo-callout-bg:${backgroundColor}">
      <div class="demo-print-callout-stripe"></div>
      <div class="demo-print-callout-copy">
        <span class="demo-print-callout-eyebrow">${escapeHtml(eyebrow)}</span>
        <h3 class="demo-print-callout-title">${escapeHtml(title)}</h3>
        <p class="demo-print-callout-body">${escapeHtml(body)}</p>
      </div>
    </section>`,
    css: `
      .demo-print-callout {
        height: 100%;
        display: grid;
        grid-template-columns: 12px 1fr;
        overflow: hidden;
        border-radius: 16px;
        background: var(--demo-callout-bg);
        border: 1px solid color-mix(in srgb, var(--demo-callout-accent) 18%, white);
      }
      .demo-print-callout-stripe {
        background:
          linear-gradient(180deg, var(--demo-callout-accent) 0%, color-mix(in srgb, var(--demo-callout-accent) 72%, black) 100%);
      }
      .demo-print-callout-copy {
        padding: 18px 20px;
      }
      .demo-print-callout-eyebrow {
        display: inline-block;
        margin-bottom: 8px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 800;
        color: var(--demo-callout-accent);
      }
      .demo-print-callout-title {
        margin: 0 0 8px;
        font-size: 20px;
        line-height: 1.1;
        color: #1f2933;
      }
      .demo-print-callout-body {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: #425466;
      }
    `,
  };
}

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
  callout: {
    type: 'callout',
    label: CALLOUT_SCHEMA.typeLabel,
    icon: CALLOUT_SCHEMA.icon,
    schema: CALLOUT_SCHEMA,
    renderKind: 'callout-card',
    createDefaultContent: () => structuredClone(defaultCalloutContent),
    createDefaultLayout: () => ({ w: 12, h: 4 }),
  },
};

export function createDemoDocument(): PageDocument {
  const document = structuredClone(createDefaultDocument());
  const questionsBlockId = 'demo-questions-block';
  const calloutBlockId = 'demo-callout-block';

  return {
    ...document,
    blocks: [
      ...document.blocks,
      {
        id: calloutBlockId,
        blockType: 'callout',
        schema: CALLOUT_SCHEMA,
        data: structuredClone(defaultCalloutContent),
      },
      {
        id: questionsBlockId,
        blockType: 'questions',
        schema: QUESTIONS_SCHEMA,
        data: structuredClone(defaultQuestionsContent),
      },
    ],
    layout: [
      ...document.layout,
      {
        id: 'demo-callout-layout',
        blockId: calloutBlockId,
        x: 0,
        y: 10,
        w: 12,
        h: 4,
        locked: false,
        hidden: false,
        zIndex: document.layout.length,
      },
      {
        id: 'demo-questions-layout',
        blockId: questionsBlockId,
        x: 0,
        y: 15,
        w: 12,
        h: 8,
        locked: false,
        hidden: false,
        zIndex: document.layout.length + 1,
      },
    ],
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}
