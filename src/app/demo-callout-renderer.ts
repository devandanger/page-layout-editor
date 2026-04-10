import { Component, Input } from '@angular/core';
import { ContentBlock, LayoutBlock } from 'page-layout-editor';

@Component({
  selector: 'app-demo-callout-renderer',
  standalone: true,
  template: `
    <section
      class="demo-callout-renderer"
      data-testid="demo-callout-renderer"
      [class.selected]="selected"
      [class.readonly]="readonly"
      [style.--demo-callout-accent]="accentColor"
      [style.--demo-callout-bg]="backgroundColor"
    >
      <div class="demo-callout-stripe"></div>
      <div class="demo-callout-copy">
        <span class="demo-callout-eyebrow">{{ eyebrow }}</span>
        <h3 class="demo-callout-title">{{ title }}</h3>
        <p class="demo-callout-body">{{ body }}</p>
      </div>
    </section>
  `,
  styles: [`
    .demo-callout-renderer {
      height: 100%;
      display: grid;
      grid-template-columns: 14px 1fr;
      overflow: hidden;
      border-radius: 18px;
      background: var(--demo-callout-bg);
      border: 1px solid color-mix(in srgb, var(--demo-callout-accent) 16%, white);
      box-shadow: 0 18px 30px rgba(28, 42, 56, 0.08);
    }

    .demo-callout-renderer.selected {
      box-shadow:
        0 18px 30px rgba(28, 42, 56, 0.08),
        inset 0 0 0 2px rgba(18, 94, 160, 0.16);
    }

    .demo-callout-renderer.readonly {
      opacity: 0.94;
    }

    .demo-callout-stripe {
      background:
        linear-gradient(180deg, var(--demo-callout-accent) 0%, color-mix(in srgb, var(--demo-callout-accent) 72%, black) 100%);
    }

    .demo-callout-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.55rem;
      padding: 1.1rem 1.2rem 1.2rem;
    }

    .demo-callout-eyebrow {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 800;
      color: var(--demo-callout-accent);
    }

    .demo-callout-title {
      margin: 0;
      font-size: 1.18rem;
      line-height: 1.08;
      color: #1f2933;
    }

    .demo-callout-body {
      margin: 0;
      max-width: 60ch;
      font-size: 0.86rem;
      line-height: 1.5;
      color: #425466;
    }
  `],
})
export class DemoCalloutRendererComponent {
  @Input() block!: ContentBlock;
  @Input() layout!: LayoutBlock;
  @Input() selected = false;
  @Input() readonly = false;

  get eyebrow(): string {
    return String(this.block?.data['eyebrow'] ?? '');
  }

  get title(): string {
    return String(this.block?.data['title'] ?? '');
  }

  get body(): string {
    return String(this.block?.data['body'] ?? '');
  }

  get accentColor(): string {
    return String(this.block?.data['accentColor'] ?? '#c62828');
  }

  get backgroundColor(): string {
    return String(this.block?.data['backgroundColor'] ?? '#fff8f2');
  }
}
