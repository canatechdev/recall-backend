import api from './axios'

export const getBanners = () => api.get('/api/banners')

export const createBanner = (formData) => api.post('/api/banners', formData)

export const deleteBanner = (id) => api.delete(`/api/banners/${id}`)

export const getBannerById = (id) => api.get(`/api/banners/${id}`)

export const updateBanner = (id, formData) => api.put(`/api/banners/${id}`, formData)

export const toggleBannerStatus = (id, status) =>
  api.patch(`/api/banners/${id}/status`, {
    is_active: status,
  })