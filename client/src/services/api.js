import axios from 'axios';

/**
 * Axios instance configured for API communication.
 * Automatically handles base URL configuration and default JSON headers.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for auth token if available
api.interceptors.request.use((config) => {
  // Retrieve the current user's authentication token from local storage
  const token = localStorage.getItem('token');
  console.log('📡 API_REQUEST: Initializing handshake...', { url: config.url, hasToken: !!token });
  if (token) {
    // Attach the token as a Bearer token to authorize the request
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
