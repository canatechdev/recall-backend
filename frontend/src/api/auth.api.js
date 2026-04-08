import api from './axios'

export const login = (payload) => api.post('auth/login', payload, { skipAuth: true, skipAuthRefresh: true })
export const refresh = () => api.post('auth/refresh', null, { skipAuth: true, skipAuthRefresh: true })
export const logout = () => api.delete('auth/logout', { skipAuth: true, skipAuthRefresh: true })
