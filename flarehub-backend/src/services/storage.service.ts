import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { AppError } from '../types/index.js';

const BUCKET_ALLOWLISTS: Record<string, { types: string[]; maxBytes: number }> = {
  profiles: {
    types:    ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
  },
  evidence: {
    types: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/quicktime',
      'audio/mpeg', 'audio/wav',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
    ],
    maxBytes: 50 * 1024 * 1024,
  },
  documents: {
    types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
    maxBytes: 50 * 1024 * 1024,
  },
  submissions: {
    types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxBytes: 25 * 1024 * 1024,
  },
  templates: {
    types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxBytes: 25 * 1024 * 1024,
  },
};

export function validateFileType(mimeType: string, bucket: string): void {
  const allowlist = BUCKET_ALLOWLISTS[bucket];
  if (!allowlist) throw new AppError('VALIDATION_ERROR', `Unknown storage bucket: ${bucket}`, 400);
  if (!allowlist.types.includes(mimeType)) {
    throw new AppError('VALIDATION_ERROR', `File type ${mimeType} is not allowed in bucket ${bucket}`, 400);
  }
}

export function validateFileSize(bytes: number, bucket: string): void {
  const allowlist = BUCKET_ALLOWLISTS[bucket];
  if (!allowlist) throw new AppError('VALIDATION_ERROR', `Unknown storage bucket: ${bucket}`, 400);
  if (bytes > allowlist.maxBytes) {
    const maxMB = allowlist.maxBytes / (1024 * 1024);
    throw new AppError('VALIDATION_ERROR', `File size exceeds the ${maxMB}MB limit for bucket ${bucket}`, 400);
  }
}

export function isAllowedBucket(bucket: string): boolean {
  return bucket in BUCKET_ALLOWLISTS;
}

export async function getSignedUploadUrl(
  supabase:    SupabaseClient,
  bucket:      string,
  filename:    string,
  mimeType:    string,
  expiresIn = 300,
): Promise<{ uploadUrl: string; storagePath: string; expiresIn: number }> {
  const storagePath = `${randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate upload URL', 500);
  }

  return { uploadUrl: data.signedUrl, storagePath, expiresIn };
}

export async function getSignedDownloadUrl(
  supabase:    SupabaseClient,
  bucket:      string,
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate download URL', 500);
  }

  return data.signedUrl;
}

export async function getSignedDownloadUrls(
  supabase:     SupabaseClient,
  bucket:       string,
  storagePaths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(storagePaths, expiresIn);

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate download URLs', 500);
  }

  return new Map(
    data
      .filter((r): r is typeof r & { path: string; signedUrl: string } => !!r.path && !!r.signedUrl)
      .map((r) => [r.path, r.signedUrl]),
  );
}

export function getPublicUrl(
  supabase:    SupabaseClient,
  bucket:      string,
  storagePath: string,
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteFile(
  supabase:    SupabaseClient,
  bucket:      string,
  storagePath: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete file from storage', 500);
  }
}
