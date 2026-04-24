-- JSON mảng URL đính kèm GV (tối đa 5) cần TEXT
ALTER TABLE checkpoints
  MODIFY COLUMN attachment_url TEXT NULL
  COMMENT 'File đính kèm GV: một link hoặc JSON ["url1",...] (tối đa 5)';
