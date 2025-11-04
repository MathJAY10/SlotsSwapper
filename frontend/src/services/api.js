import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
}

export const eventsApi = {
  getAll: () => api.get('/events'),
  create: (title, startTime, endTime, status = 'BUSY') =>
    api.post('/events', { title, startTime, endTime, status }),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
}

export const swapsApi = {
  getSwappableSlots: (page = 1) =>
    api.get(`/swappable-slots?page=${page}`),
  createRequest: (mySlotId, theirSlotId) =>
    api.post('/swap-request', { mySlotId, theirSlotId }),
  respondToRequest: (requestId, accept) =>
    api.post(`/swap-response/${requestId}`, { accept }),
  getRequests: () => api.get('/requests'),
}

export default api
