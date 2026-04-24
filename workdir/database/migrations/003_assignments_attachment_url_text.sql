-- Mảng URL đính kèm GV (JSON) cần TEXT thay vì VARCHAR(500)
ALTER TABLE assignments
  MODIFY COLUMN attachment_url TEXT NULL
  COMMENT 'URL file đính kèm GV: một link hoặc JSON ["url1","url2",...] (tối đa 5)';
