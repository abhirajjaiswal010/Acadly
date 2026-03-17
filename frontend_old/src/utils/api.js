import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnlive_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('learnlive_token');
      localStorage.removeItem('learnlive_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  getUsers: () => API.get('/auth/users'),
};

// ─── Classes ────────────────────────────────────────────
export const classAPI = {
  getClasses: () => API.get('/classes'),
  getClass: (id) => API.get(`/classes/${id}`),
  getClassBySession: (sessionId) => API.get(`/classes/session/${sessionId}`),
  createClass: (data) => API.post('/classes', data),
  updateClass: (id, data) => API.put(`/classes/${id}`, data),
  deleteClass: (id) => API.delete(`/classes/${id}`),
  joinClass: (data) => API.post('/classes/join', data),
  getAllClassesAdmin: () => API.get('/classes/admin/all'),
};

export default API;
