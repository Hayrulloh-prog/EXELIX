-- EXELIX Database Setup Script
-- Полная очистка и настройка по ТЗ

-- Очистка существующих таблиц
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Создание таблицы пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_country VARCHAR(2) NOT NULL DEFAULT 'KG',
    telegram VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    language VARCHAR(2) NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'ky', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы QR-кодов
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- Создание таблицы уведомлений
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_phone VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'blocking_road', 'wrong_parking', 'alarm', 'being_towed', 
        'minor_accident', 'serious_accident', 'other'
    )),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы лимитов
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) NOT NULL, -- phone or IP
    type VARCHAR(20) NOT NULL CHECK (type IN ('send', 'receive')),
    count INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, type, date)
);

-- Создание индексов для производительности
CREATE INDEX idx_users_phone ON users(phone, phone_country);
CREATE INDEX idx_qr_codes_token ON qr_codes(token);
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_unused ON qr_codes(is_used) WHERE is_used = FALSE;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, type, date);

-- Вставка тестовых QR-кодов (100 штук)
INSERT INTO qr_codes (token) VALUES
('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'),
('b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'),
('c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678'),
('d4e5f6789012345678901234567890abcdef1234567890abcdef123456789'),
('e5f6789012345678901234567890abcdef1234567890abcdef1234567890a'),
('f6789012345678901234567890abcdef1234567890abcdef1234567890ab'),
('789012345678901234567890abcdef1234567890abcdef1234567890abc'),
('89012345678901234567890abcdef1234567890abcdef1234567890abcd'),
('9012345678901234567890abcdef1234567890abcdef1234567890abcde'),
('012345678901234567890abcdef1234567890abcdef1234567890abcdef'),
('12345678901234567890abcdef1234567890abcdef1234567890abcdef1'),
('2345678901234567890abcdef1234567890abcdef1234567890abcdef12'),
('345678901234567890abcdef1234567890abcdef1234567890abcdef123'),
('45678901234567890abcdef1234567890abcdef1234567890abcdef1234'),
('5678901234567890abcdef1234567890abcdef1234567890abcdef12345'),
('678901234567890abcdef1234567890abcdef1234567890abcdef123456'),
('78901234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('8901234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('901234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('01234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
('111111111111111111111111111111111111111111111111111111111111'),
('222222222222222222222222222222222222222222222222222222222222'),
('333333333333333333333333333333333333333333333333333333333333'),
('444444444444444444444444444444444444444444444444444444444444'),
('555555555555555555555555555555555555555555555555555555555555'),
('666666666666666666666666666666666666666666666666666666666666'),
('777777777777777777777777777777777777777777777777777777777777'),
('888888888888888888888888888888888888888888888888888888888888'),
('999999999999999999999999999999999999999999999999999999999999'),
('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'),
('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
('abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456'),
('bcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('cdef1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('def1234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('ef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
('f1234567890abcdef1234567890abcdef1234567890abcdef1234567890a'),
('1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('234567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('34567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('4567890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'),
('0abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345'),
('abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456'),
('bcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('cdef1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('def1234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('ef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
('f1234567890abcdef1234567890abcdef1234567890abcdef1234567890a'),
('test1234567890abcdef1234567890abcdef1234567890abcdef123456'),
('demo234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('sample34567890abcdef1234567890abcdef1234567890abcdef12345678'),
('example4567890abcdef1234567890abcdef1234567890abcdef123456789'),
('qr567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('code67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('exelix7890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('car890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('auto90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('vehicle0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('transportabcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('parking1234567890abcdef1234567890abcdef1234567890abcdef12345'),
('traffic234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('road34567890abcdef1234567890abcdef1234567890abcdef12345678'),
('drive4567890abcdef1234567890abcdef1234567890abcdef123456789'),
('park567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('stop67890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('move7890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('go890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('start90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('begin0abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('initabcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('launch1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('run234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('execute34567890abcdef1234567890abcdef1234567890abcdef123456789'),
('process4567890abcdef1234567890abcdef1234567890abcdef1234567890'),
('handle567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('manage67890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('control7890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('admin890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('system90abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('server0abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('databaseabcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('backend1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('frontend234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('app34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('web4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('site567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('portal67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('platform7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('service890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('api90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('interface0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('uiabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('ux1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('design234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('layout34567890abcdef1234567890abcdef1234567890abcdef1234567890'),
('style4567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('theme567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('color67890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('gradient7890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('animation890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('transition90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('responsive0abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('mobileabcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('tablet1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('desktop234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('phone34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('device4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('screen567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('display67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('monitor7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('view890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('window90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('browser0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('chromeabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('firefox1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('safari234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('edge34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('explorer4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('opera567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('brave67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('vivaldi7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('tor890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('duckduckgo90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('search0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('googleabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('yandex1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('bing234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('yahoo34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('duck4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('baidu567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('yandex67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('mail7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('gmail890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('outlook90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('telegram0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('whatsappabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('viber1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('signal234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('threema34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('wire4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('session567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('element67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('discord7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('slack890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
('teams90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
('zoom0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
('skypeabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
('meet1234567890abcdef1234567890abcdef1234567890abcdef12345678'),
('hangouts234567890abcdef1234567890abcdef1234567890abcdef123456789'),
('facetime34567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
('imessage4567890abcdef1234567890abcdef1234567890abcdef1234567890abc'),
('wechat567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'),
('line67890abcdef1234567890abcdef1234567890abcdef1234567890abcde'),
('kakao7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
('kik890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1');

-- Вывод статистики
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'qr_codes', COUNT(*) FROM qr_codes  
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'rate_limits', COUNT(*) FROM rate_limits;

-- Сообщение об успешной настройке
SELECT 'EXELIX Database Setup Complete!' as status,
       '100 QR codes generated and ready for testing' as info;
