# EXELIX API Specification

## 🌐 Base URL
- **Production**: `https://api.exelix.com/v1`
- **Staging**: `https://staging-api.exelix.com/v1`
- **Development**: `http://localhost:3001/api/v1`

## 🔐 Authentication

### JWT Token Structure
```json
{
  "sub": "user_id",
  "type": "user|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept-Language: ru|ky|en
```

## 📝 API Endpoints

### 🏠 Public Endpoints

#### GET `/health`
Health check endpoint
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

#### GET `/qr/:token`
Validate QR token and get user info
```json
// Response 200 - Valid QR
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "status": "open|closed",
    "language": "ru|ky|en"
  }
}

// Response 404 - Invalid QR
{
  "success": false,
  "error": "QR_NOT_FOUND",
  "message": "QR code not found or invalid"
}
```

#### POST `/qr/:token/register`
Register new user via QR code
```json
// Request Body
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+996700123456",
  "phone_country": "KG",
  "telegram_username": "@ivanov",
  "avatar": "base64_image_data",
  "status": "open|closed",
  "language": "ru|ky|en"
}

// Response 201
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "first_name": "Иван",
      "last_name": "Иванов",
      "phone": "+996700123456",
      "telegram_username": "@ivanov",
      "avatar_url": "https://cdn.exelix.com/avatars/uuid.jpg",
      "status": "open",
      "language": "ru"
    }
  }
}
```

#### POST `/qr/:token/notify`
Send notification to user (public access)
```json
// Request Body
{
  "notifications": [
    {
      "type": "blocking|parking|alarm|evacuation|minor_accident|major_accident",
      "message": "Ваш автомобиль перекрывает проезд"
    }
  ],
  "sender_info": {
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}

// Response 200
{
  "success": true,
  "message": "Notifications sent successfully"
}

// Response 429 - Rate limit exceeded
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Daily limit exceeded"
}
```

### 🔐 Protected User Endpoints

#### GET `/user/profile`
Get current user profile
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+996700123456",
    "phone_country": "KG",
    "telegram_username": "@ivanov",
    "avatar_url": "https://cdn.exelix.com/avatars/uuid.jpg",
    "status": "open",
    "language": "ru",
    "daily_limits": {
      "sent": 0,
      "received": 3,
      "limit": 10
    }
  }
}
```

#### PUT `/user/profile`
Update user profile
```json
// Request Body
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+996700123456",
  "phone_country": "KG",
  "telegram_username": "@ivanov",
  "avatar": "base64_image_data",
  "status": "open|closed",
  "language": "ru|ky|en"
}

// Response 200
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST `/user/avatar`
Upload user avatar
```json
// Request Body (multipart/form-data)
avatar: File (image/jpeg, image/png, max 5MB)

// Response 200
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.exelix.com/avatars/uuid.jpg"
  }
}
```

#### GET `/user/notifications`
Get user notifications
```json
// Query Parameters
?page=1&limit=20&date=2024-01-01

// Response 200
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "blocking",
        "message": "Ваш автомобиль перекрывает проезд",
        "sent_at": "2024-01-01T12:00:00Z",
        "is_delivered": true,
        "delivery_method": "push"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "has_more": true
    }
  }
}
```

#### POST `/user/push-subscription`
Register PWA push subscription
```json
// Request Body
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "public_key",
    "auth": "auth_key"
  }
}

// Response 200
{
  "success": true,
  "message": "Push subscription registered"
}
```

### 🛡️ Admin Endpoints

#### POST `/admin/login`
Admin authentication
```json
// Request Body
{
  "username": "admin",
  "password": "password"
}

// Response 200
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "admin": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@exelix.com"
    }
  }
}
```

#### GET `/admin/stats`
Get system statistics
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "active_users": 1200,
    "total_requests": 5000,
    "successful_requests": 4800,
    "failed_requests": 200,
    "inactive_qr_codes": 50,
    "daily_stats": [
      {
        "date": "2024-01-01",
        "new_users": 25,
        "notifications": 150
      }
    ]
  }
}
```

#### GET `/admin/users`
Get users list
```json
// Query Parameters
?page=1&limit=40&status=open&language=ru&search=Иван

// Response 200
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "first_name": "Иван",
        "last_name": "Иванов",
        "phone": "+996700123456",
        "telegram_username": "@ivanov",
        "avatar_url": "https://cdn.exelix.com/avatars/uuid.jpg",
        "status": "open",
        "language": "ru",
        "created_at": "2024-01-01T00:00:00Z",
        "notifications_count": 15
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 40,
      "total": 1500,
      "has_more": true
    }
  }
}
```

#### POST `/admin/qr/generate`
Generate QR codes batch
```json
// Request Body
{
  "count": 100,
  "batch_name": "January 2024"
}

// Response 200
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "download_url": "https://cdn.exelix.com/qr/batch_uuid.zip",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

#### GET `/admin/qr/batches`
Get QR batches list
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "uuid",
        "batch_name": "January 2024",
        "total_codes": 100,
        "generated_by": "admin",
        "file_url": "https://cdn.exelix.com/qr/batch_uuid.zip",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "validation_error_details"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `QR_NOT_FOUND` - QR token not found or invalid
- `USER_ALREADY_EXISTS` - User already registered
- `DAILY_LIMIT_EXCEEDED` - Daily notification limit exceeded
- `INTERNAL_ERROR` - Server error

## 📊 Rate Limiting

### Limits
- **Public QR validation**: 100 requests/IP/hour
- **Notification sending**: 3 requests/IP/day
- **User registration**: 1 request/IP/hour
- **Admin endpoints**: 1000 requests/user/hour

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🌍 Internationalization

### Supported Languages
- `ru` - Русский
- `ky` - Кыргызский  
- `en` - English

### Language Detection
1. `Accept-Language` header
2. User profile preference
3. Default: `ru`

## 🔔 Webhooks

### Notification Delivery Events
```json
// POST to configured webhook URL
{
  "event": "notification.delivered",
  "data": {
    "notification_id": "uuid",
    "user_id": "uuid",
    "type": "push|telegram",
    "status": "delivered|failed",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 📱 PWA Endpoints

#### GET `/manifest.json`
PWA manifest
```json
{
  "name": "EXELIX",
  "short_name": "EXELIX",
  "description": "Связь с владельцем автомобиля через QR-код",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#CC3033",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### GET `/service-worker.js`
Service worker for PWA functionality

## 📝 API Versioning

### Version Strategy
- URL path versioning: `/v1/`, `/v2/`
- Backward compatibility for 6 months
- Deprecation warnings in headers

### Version Headers
```
API-Version: 1.0
Supported-Versions: 1.0, 1.1
Deprecated-Versions: 0.9
