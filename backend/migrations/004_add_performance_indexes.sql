-- Добавление индексов для оптимизации производительности при 20,000+ пользователей

-- Индексы для таблицы users (оптимизация поиска по телефону, telegram, qr_token)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(LOWER(telegram_username));
CREATE INDEX IF NOT EXISTS idx_users_qr_token ON users(qr_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Индексы для таблицы notifications (оптимизация запросов по user_id, created_at)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Индексы для таблицы qr_codes (оптимизация поиска по токену и статусу)
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_used ON qr_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at DESC);

-- Индексы для таблицы statistics (оптимизация запросов по дате)
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);

-- Композитный индекс для самых частых запросов уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Индекс для поиска активных QR кодов
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_used, created_at DESC) WHERE is_used = false;

-- Анализ и обновление статистики индексов
ANALYZE users;
ANALYZE notifications;
ANALYZE qr_codes;
ANALYZE statistics;

COMMENT ON INDEX idx_users_phone IS 'Оптимизация поиска пользователей по номеру телефона';
COMMENT ON INDEX idx_users_telegram_username IS 'Оптимизация поиска пользователей по Telegram никнейму';
COMMENT ON INDEX idx_users_qr_token IS 'Оптимизация поиска пользователей по QR токену';
COMMENT ON INDEX idx_notifications_user_id IS 'Оптимизация получения уведомлений пользователя';
COMMENT ON INDEX idx_notifications_created_at IS 'Оптимизация сортировки уведомлений по дате';
COMMENT ON INDEX idx_notifications_user_created ON 'Оптимизация запросов уведомлений с сортировкой';
COMMENT ON INDEX idx_qr_codes_token IS 'Оптимизация поиска QR кодов по токену';
COMMENT ON INDEX idx_qr_codes_is_used IS 'Оптимизация фильтрации неиспользованных QR кодов';
COMMENT ON INDEX idx_statistics_date IS 'Оптимизация запросов статистики по дате';
