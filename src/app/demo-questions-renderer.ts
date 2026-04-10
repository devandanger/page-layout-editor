import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentBlock, LayoutBlock } from 'page-layout-editor';

@Component({
  selector: 'app-demo-questions-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="demo-questions-renderer"
      data-testid="demo-questions-renderer"
      [class.selected]="selected"
      [class.readonly]="readonly"
    >
      <header class="demo-questions-header">
        <span class="demo-questions-title">Worksheet Questions</span>
        <span class="demo-questions-meta">{{ questionItems.length }} prompts</span>
      </header>
      <span class="demo-renderer-state" data-testid="custom-renderer-selected-state">
        {{ selected ? 'selected' : 'not-selected' }}
      </span>

      <div
        class="demo-questions-grid"
        [style.grid-template-columns]="'repeat(' + columns + ', 1fr)'"
      >
        @for (item of questionItems; track $index) {
          <article class="demo-question-card">
            <div class="demo-question-row">
              <span class="demo-question-num">{{ $index + 1 }}.</span>
              <span class="demo-question-text">{{ item.question }}</span>
            </div>
            @if (showAnswers && item.answer) {
              <div class="demo-answer-row">Answer: {{ item.answer }}</div>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .demo-questions-renderer {
      height: 100%;
      padding: 1rem;
      background:
        linear-gradient(160deg, #fffde7 0%, #ffffff 55%, #eef7ff 100%);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .demo-questions-renderer.selected {
      box-shadow: inset 0 0 0 2px rgba(27, 94, 32, 0.14);
    }

    .demo-questions-renderer.readonly {
      opacity: 0.92;
    }

    .demo-questions-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
    }

    .demo-questions-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #234;
      letter-spacing: 0.01em;
    }

    .demo-questions-meta {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #607d8b;
      font-weight: 700;
    }

    .demo-questions-grid {
      display: grid;
      gap: 0.55rem;
      min-height: 0;
      overflow: auto;
    }

    .demo-renderer-state {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #78909c;
      font-weight: 700;
    }

    .demo-question-card {
      padding: 0.65rem 0.7rem;
      border: 1px solid rgba(35, 52, 68, 0.1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.92);
    }

    .demo-question-row {
      display: flex;
      gap: 0.45rem;
      align-items: flex-start;
      color: #1f2d3d;
      font-size: 0.84rem;
      line-height: 1.45;
    }

    .demo-question-num {
      font-weight: 700;
      color: #1565c0;
      flex: 0 0 auto;
    }

    .demo-question-text {
      flex: 1;
    }

    .demo-answer-row {
      margin-top: 0.45rem;
      padding-top: 0.4rem;
      border-top: 1px dashed rgba(21, 101, 192, 0.18);
      font-size: 0.76rem;
      color: #2e7d32;
      font-weight: 600;
    }
  `],
})
export class DemoQuestionsRendererComponent {
  @Input() block!: ContentBlock;
  @Input() layout!: LayoutBlock;
  @Input() selected = false;
  @Input() readonly = false;

  get columns(): number {
    return Math.max(1, Number(this.block?.data['columns'] ?? 2));
  }

  get showAnswers(): boolean {
    return this.block?.data['showAnswers'] !== false;
  }

  get questionItems(): Array<{ question: string; answer: string }> {
    const items = this.block?.data['questions'];
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => {
      const record = typeof item === 'object' && item ? (item as Record<string, unknown>) : {};
      return {
        question: String(record['question'] ?? ''),
        answer: String(record['answer'] ?? ''),
      };
    });
  }
}
