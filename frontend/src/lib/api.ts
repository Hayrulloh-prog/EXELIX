// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const APP_BASE_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:3000";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/v1/auth/register`,

  // QR
  VALIDATE_QR: (token: string) => `${API_BASE_URL}/v1/qr/${token}`,
  CHECK_QR_TOKEN: (token: string) => `${API_BASE_URL}/v1/qr/validate/${token}`,
  REGISTER_USER: `${API_BASE_URL}/v1/qr/register`,
  QR_REGISTER: `${API_BASE_URL}/v1/qr/register`,
  SEND_NOTIFICATION: `${API_BASE_URL}/v1/qr/notify`,
  CHECK_LIMITS: `${API_BASE_URL}/v1/qr/limits/check`,

  // Users
  GET_USER: (id: string) => `${API_BASE_URL}/v1/users/${id}`,
  UPDATE_USER: (id: string) => `${API_BASE_URL}/v1/users/${id}`,
  UPDATE_PROFILE: `${API_BASE_URL}/v1/users/me`,
  UPDATE_LANGUAGE: `${API_BASE_URL}/v1/users/language`,
  CHECK_PHONE: `${API_BASE_URL}/v1/users/check-phone`,
  CHECK_TELEGRAM: `${API_BASE_URL}/v1/users/check-telegram`,

  // Admin
  ADMIN_LOGIN: `${API_BASE_URL}/v1/admin/login`,
  ADMIN_ME: `${API_BASE_URL}/v1/admin/me`,
  ADMIN_STATS: `${API_BASE_URL}/v1/admin/stats`,
  ADMIN_USERS: `${API_BASE_URL}/v1/admin/users`,
  GENERATE_QR: `${API_BASE_URL}/v1/admin/qr/generate`,
  GENERATE_QR_BATCH: `${API_BASE_URL}/v1/admin/qr/generate-batch`,
  CLEAR_DATABASE: `${API_BASE_URL}/v1/admin/clear-database`,
  RESET_DATABASE: `${API_BASE_URL}/v1/admin/reset-database`,
  DELETE_ALL_USERS: `${API_BASE_URL}/v1/admin/users/clear`,

  // Push
  SUBSCRIBE_PUSH: `${API_BASE_URL}/v1/push/subscribe`,

  // Notifications
  GET_USER_NOTIFICATIONS: `${API_BASE_URL}/v1/notifications`,

  // Utility
  API_BASE_URL: API_BASE_URL,
};
