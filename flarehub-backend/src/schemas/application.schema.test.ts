import { describe, it, expect } from 'vitest';
import {
  applySchema,
  updateApplicationStatusSchema,
  bulkStatusSchema,
  applicationQuerySchema,
} from './application.schema.js';

describe('applySchema', () => {
  it('accepts a valid application', () => {
    const result = applySchema.safeParse({ programId: 1 });
    expect(result.success).toBe(true);
  });

  it('defaults isDraft to false', () => {
    const result = applySchema.parse({ programId: 1 });
    expect(result.isDraft).toBe(false);
  });

  it('accepts isDraft true', () => {
    const result = applySchema.parse({ programId: 1, isDraft: true });
    expect(result.isDraft).toBe(true);
  });

  it('rejects non-positive programId', () => {
    const result = applySchema.safeParse({ programId: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing programId', () => {
    const result = applySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('updateApplicationStatusSchema', () => {
  const validStatuses = ['Pending', 'UnderReview', 'Approved', 'Rejected'] as const;

  validStatuses.forEach((status) => {
    it(`accepts status "${status}"`, () => {
      const result = updateApplicationStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid status', () => {
    const result = updateApplicationStatusSchema.safeParse({ status: 'Draft' });
    expect(result.success).toBe(false);
  });
});

describe('bulkStatusSchema', () => {
  it('accepts valid ids and status', () => {
    const result = bulkStatusSchema.safeParse({ ids: [1, 2, 3], status: 'Approved' });
    expect(result.success).toBe(true);
  });

  it('rejects empty ids array', () => {
    const result = bulkStatusSchema.safeParse({ ids: [], status: 'Approved' });
    expect(result.success).toBe(false);
  });
});

describe('applicationQuerySchema', () => {
  it('defaults to page 1 and limit 20', () => {
    const result = applicationQuerySchema.parse({});
    expect(result).toMatchObject({ page: 1, limit: 20 });
  });

  it('accepts status filter', () => {
    const result = applicationQuerySchema.parse({ status: 'Pending' });
    expect(result.status).toBe('Pending');
  });

  it('coerces programId from string', () => {
    const result = applicationQuerySchema.parse({ programId: '5' });
    expect(result.programId).toBe(5);
  });
});
