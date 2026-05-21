import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const authData = JSON.parse(localStorage.getItem('auth') || '{}');
    if (authData.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle global errors (like 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle logout or refresh token here
      localStorage.removeItem('auth');
      window.location.href = '/login'; // Or use a more React-way if needed
    }
    return Promise.reject(error);
  }
);

export default api;
