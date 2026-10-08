import axios from 'axios';

const DJANGO_BASE = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
const FASTAPI_BASE = process.env.REACT_APP_FASTAPI_URL || 'http://localhost:8001';

// Django API instance
const djangoAPI = axios.create({
  baseURL: DJANGO_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// FastAPI instance
const fastapiAPI = axios.create({
  baseURL: FASTAPI_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor helper - attach JWT access token
const attachAuthToken = (config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

djangoAPI.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
fastapiAPI.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));

// Response interceptor - auto refresh token on 401
djangoAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const resp = await axios.post(`${DJANGO_BASE}/api/auth/token/refresh/`, { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem('access_token', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return djangoAPI(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

fastapiAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const resp = await axios.post(`${DJANGO_BASE}/api/auth/token/refresh/`, { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem('access_token', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return fastapiAPI(original);
      } catch {
        // If refresh fails, let caller handle error state
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export { djangoAPI, fastapiAPI };
