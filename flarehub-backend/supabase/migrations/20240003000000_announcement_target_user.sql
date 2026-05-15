-- Add individual user targeting to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_target_user_id ON announcements(target_user_id);
