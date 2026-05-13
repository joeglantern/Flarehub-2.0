import { describe, it, expect } from 'vitest';
import { createProgramSchema, updateProgramSchema, programQuerySchema } from './program.schema.js';

describe('createProgramSchema', () => {
  it('accepts a minimal valid program', () => {
    const result = createProgramSchema.safeParse({ name: 'Cohort 1' });
    expect(result.success).toBe(true);
  });

  it('accepts a full program', () => {
    const result = createProgramSchema.safeParse({
      name:                    'Cohort 1',
      description:             'Entrepreneurship program',
      applicationDeadline:     '2026-12-31T00:00:00.000Z',
      status:                  'Active',
      maxParticipants:         50,
      grantAmount:             100000,
      eligibilityRequirements: 'Must be 18+',
      tags:                    ['youth', 'kenya'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createProgramSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createProgramSchema.safeParse({ name: 'Test', status: 'Draft' });
    expect(result.success).toBe(false);
  });

  it('rejects negative grantAmount', () => {
    const result = createProgramSchema.safeParse({ name: 'Test', grantAmount: -1 });
    expect(result.success).toBe(false);
  });
});

describe('updateProgramSchema', () => {
  it('accepts empty update (all fields optional)', () => {
    const result = updateProgramSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = updateProgramSchema.safeParse({ status: 'Inactive' });
    expect(result.success).toBe(true);
  });
});

describe('programQuerySchema', () => {
  it('defaults to page 1 and limit 20', () => {
    const result = programQuerySchema.parse({});
    expect(result).toMatchObject({ page: 1, limit: 20 });
  });

  it('filters by status', () => {
    const result = programQuerySchema.parse({ status: 'Active' });
    expect(result.status).toBe('Active');
  });

  it('rejects invalid status', () => {
    const result = programQuerySchema.safeParse({ status: 'Pending' });
    expect(result.success).toBe(false);
  });
});
