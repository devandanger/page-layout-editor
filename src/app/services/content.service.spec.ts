import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContentService);
    service.reset();
  });

  it('updates the stored document', () => {
    const initial = service.data();
    const next = {
      ...initial,
      blocks: initial.blocks.slice(0, 1),
      layout: initial.layout.slice(0, 1),
    };

    service.update(next);

    expect(service.data().blocks).toHaveLength(1);
    expect(service.data().layout).toHaveLength(1);
  });

  it('updates a content block by id', () => {
    const target = service.data().blocks[0];

    service.updateBlock(target.id, {
      ...target,
      data: { ...target.data, alt: 'Updated alt' },
    });

    expect(service.getBlock(target.id)?.data['alt']).toBe('Updated alt');
  });
});
