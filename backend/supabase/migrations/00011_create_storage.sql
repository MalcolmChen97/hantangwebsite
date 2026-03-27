-- Note: 存储桶与 storage.objects 策略由迁移 00013 创建；本地说明见 deployment-guide。

-- Bucket: avatars
-- Public: true (public read, authenticated write)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Bucket: signatures
-- Public: false (authenticated read/write only)
-- File size limit: 2MB
-- Allowed MIME types: image/png
