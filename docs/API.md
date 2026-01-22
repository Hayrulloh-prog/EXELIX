# API Specification

Base URL: `/api/v1`

## Authentication

Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Public Endpoints

#### `GET /api/v1/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### `POST /api/v1/qr/validate`
Validate QR code token.

**Request:**
```json
{
  "token": "abc123..."
}
```

**Response (valid, unused):**
```json
{
  "valid": true,
  "used": false,
  "canRegister": true
}
```

**Response (valid, used):**
```json
{
  "valid": true,
  "used": true,
  "canRegister": false,
  "userId": "uuid-here"
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "Invalid QR code"
}
```

### Authentication Endpoints

#### `POST /api/v1/auth/register`
Register new car owner.

**Request:**
```json
{
  "qrToken": "abc123...",
  "firstName": "Иван",
  "lastName": "Иванов",
  "phone": "+996555123456",
  "phoneCountry": "KG",
  "telegram": "@username",
  "avatar": "data:image/jpeg;base64,...",
  "status": "open",
  "language": "ru"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firstName": "Иван",
    "lastName": "Иванов",
    "phone": "+996555123456",
    "status": "open"
  },
  "token": "jwt-token-here"
}
```

#### `POST /api/v1/auth/login`
Login with QR token (for existing users).

**Request:**
```json
{
  "qrToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt-token-here"
}
```

### User Endpoints

#### `GET /api/v1/users/me`
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Иван",
  "lastName": "Иванов",
  "phone": "+996555123456",
  "phoneCountry": "KG",
  "telegram": "@username",
  "avatarUrl": "/uploads/avatar.jpg",
  "status": "open",
  "language": "ru",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### `PUT /api/v1/users/me`
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "firstName": "Иван",
  "lastName": "Иванов",
  "phone": "+996555123456",
  "phoneCountry": "KG",
  "telegram": "@newusername",
  "avatar": "data:image/jpeg;base64,...",
  "status": "closed",
  "language": "ky"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

#### `POST /api/v1/users/push-subscribe`
Subscribe to push notifications.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### Notification Endpoints

#### `POST /api/v1/notifications/send`
Send notification to car owner.

**Request:**
```json
{
  "qrToken": "abc123...",
  "types": ["alarm", "evacuation"],
  "message": "Optional message"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Notification sent"
}
```

**Response (rate limit):**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Daily limit reached"
}
```

**Response (owner limit):**
```json
{
  "success": false,
  "error": "OWNER_LIMIT_EXCEEDED",
  "message": "Owner has reached daily limit"
}
```

### Admin Endpoints

#### `POST /api/v1/admin/login`
Admin login.

**Request:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "admin-jwt-token",
  "admin": {
    "id": "uuid",
    "username": "admin"
  }
}
```

#### `GET /api/v1/admin/stats`
Get statistics.

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "totalUsers": 1234,
  "totalRequests": 5678,
  "successfulRequests": 5000,
  "failedRequests": 678,
  "inactiveQRCodes": 100
}
```

#### `GET /api/v1/admin/users`
Get users list.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 40)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "firstName": "Иван",
      "lastName": "Иванов",
      "phone": "+996555123456",
      "telegram": "@username",
      "avatarUrl": "/uploads/avatar.jpg",
      "status": "open",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 40,
    "total": 1234,
    "totalPages": 31
  }
}
```

#### `POST /api/v1/admin/qr/generate`
Generate QR codes.

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "count": 100
}
```

**Response:**
```json
{
  "success": true,
  "count": 100,
  "fileUrl": "/api/v1/admin/qr/download?batch=uuid"
}
```

#### `GET /api/v1/admin/qr/download`
Download QR codes SVG.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `batch` (string, required) - Batch ID

**Response:** SVG file download

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

### Error Codes

- `INVALID_TOKEN` - Invalid or expired JWT token
- `INVALID_QR` - Invalid QR code token
- `QR_ALREADY_USED` - QR code already registered
- `RATE_LIMIT_EXCEEDED` - Sender rate limit exceeded
- `OWNER_LIMIT_EXCEEDED` - Owner rate limit exceeded
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## Rate Limits

- **Sender**: 3 notifications per day per IP
- **Owner**: 10 notifications per day per user
- Reset: Daily at 00:00 UTC

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
