import { Router } from 'express';

import { send } from '../controllers/notificationController';

import { validateSendNotification } from '../utils/validation';

import { apiRateLimit, notificationRateLimit } from '../middleware/rateLimit';

import { authenticate } from '../middleware/auth';

import { getUserNotifications, markNotificationAsRead, checkNotificationReadStatus, markAllNotificationsAsRead, getUnreadCount } from '../controllers/notificationsController';



const router = Router();



// Добавим middleware для логирования всех запросов

router.use((req, res, next) => {

  console.log(`🔔 Notifications route called: ${req.method} ${req.path}`);

  next();

});



// Публичный роут для отправки уведомлений

router.post('/send', notificationRateLimit, validateSendNotification, send);



// Публичный роут для проверки статуса прочтения уведомлений по токену

router.get('/check-read-status', checkNotificationReadStatus);



// Роуты для пользователей (требуют аутентификацию)

router.use(authenticate);



// Получить уведомления пользователя

router.get('/', getUserNotifications);

// Получение количества непрочитанных
router.get('/unread-count', getUnreadCount);



// Отметить уведомление как прочитанное

router.post('/user/:notificationId/read', markNotificationAsRead);


// Отметить все уведомления как прочитанные

router.post('/mark-all-read', markAllNotificationsAsRead);



export default router;
