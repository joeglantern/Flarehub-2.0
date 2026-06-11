-- Create Flarehub storage buckets
-- Run via: supabase db push
-- Idempotent: ON CONFLICT DO NOTHING means safe to run multiple times

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'documents',
    'documents',
    false,
    52428800, -- 50 MB
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ]
  ),
  (
    'evidence',
    'evidence',
    false,
    52428800, -- 50 MB
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  ),
  (
    'profiles',
    'profiles',
    false,
    5242880, -- 5 MB
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  ),
  (
    'templates',
    'templates',
    true, -- public: template files are freely downloadable
    26214400, -- 25 MB
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  ),
  (
    'submissions',
    'submissions',
    false,
    26214400, -- 25 MB
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
ON CONFLICT (id) DO NOTHING;
