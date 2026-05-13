import { describe, it, expect } from 'vitest';
import { sendMessageSchema, messageThreadQuerySchema, editMessageSchema } from './message.schema.js';

describe('sendMessageSchema', () => {
  it('accepts valid receiverId and content', () => {
    const result = sendMessageSchema.safeParse({
      receiverId: '550e8400-e29b-41d4-a716-446655440000',
      content:    'Hello!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID receiverId', () => {
    const result = sendMessageSchema.safeParse({ receiverId: 'not-a-uuid', content: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = sendMessageSchema.safeParse({
      receiverId: '550e8400-e29b-41d4-a716-446655440000',
      content:    '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content over 5000 characters', () => {
    const result = sendMessageSchema.safeParse({
      receiverId: '550e8400-e29b-41d4-a716-446655440000',
      content:    'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts content at exactly 5000 characters', () => {
    const result = sendMessageSchema.safeParse({
      receiverId: '550e8400-e29b-41d4-a716-446655440000',
      content:    'a'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });
});

describe('messageThreadQuerySchema', () => {
  it('defaults to page 1 and limit 50', () => {
    const result = messageThreadQuerySchema.parse({});
    expect(result).toEqual({ page: 1, limit: 50 });
  });

  it('coerces string numbers', () => {
    const result = messageThreadQuerySchema.parse({ page: '2', limit: '25' });
    expect(result).toEqual({ page: 2, limit: 25 });
  });

  it('rejects limit over 100', () => {
    const result = messageThreadQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects page 0', () => {
    const result = messageThreadQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });
});

describe('editMessageSchema', () => {
  it('accepts valid content', () => {
    const result = editMessageSchema.safeParse({ content: 'Updated message' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = editMessageSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });
});
