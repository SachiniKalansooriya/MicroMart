import axios from 'axios';

// Change this to your backend API URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7040',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
