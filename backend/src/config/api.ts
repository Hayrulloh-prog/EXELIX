export const API_CONFIG = {
  // Base URL for the API - should be set via environment variables
  BASE_URL: process.env.API_BASE_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 3002}`,

  // Get the full URL for API endpoints
  getApiUrl: (path: string = '') => {
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },

  // Get the URL for user avatar
  getAvatarUrl: (userId: string) => {
    // Return path without /api prefix since frontend adds it via API_BASE_URL
    return `/v1/users/${userId}/avatar`;
  }
};
