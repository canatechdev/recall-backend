import api from './axios'

export const login = (payload) => api.post('api/auth/login', payload, { skipAuth: true, skipAuthRefresh: true })
export const refresh = () => api.post('api/auth/refresh', null, { skipAuth: true, skipAuthRefresh: true })
export const logout = () => api.delete('api/auth/logout', { skipAuth: true, skipAuthRefresh: true })
