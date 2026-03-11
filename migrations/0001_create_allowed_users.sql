CREATE TABLE IF NOT EXISTS `allowed_users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL UNIQUE,
  `name` text,
  `created_at` text NOT NULL,
  `added_by` text,
  `is_active` integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS `access_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `action` text NOT NULL,
  `timestamp` text NOT NULL,
  `ip_address` text
);

-- 허용 사용자 초기 데이터
INSERT OR IGNORE INTO `allowed_users` (`email`, `name`, `created_at`, `added_by`, `is_active`)
VALUES ('kts123@kookmin.ac.kr', '관리자', datetime('now'), 'system', 1);
