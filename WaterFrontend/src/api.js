import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Debug interceptor to log all requests
api.interceptors.request.use(
  (config) => {
    console.log('DEBUG API REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('DEBUG API BASE URL:', API_BASE_URL);
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors without redirecting to admin login
// This allows components to handle auth errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on any error - let the calling component handle it
    // This is especially important for the Invoice page which is not protected
    return Promise.reject(error);
  }
);

export default api;
