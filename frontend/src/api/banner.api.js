import api from './axios'

export const getBanners = () => api.get('/banners')

export const createBanner = (formData) => api.post('/banners', formData)

export const deleteBanner = (id) => api.delete(`/banners/${id}`)

export const getBannerById = (id) => api.get(`/banners/${id}`)

export const updateBanner = (id, formData) => api.put(`/banners/${id}`, formData)

export const toggleBannerStatus = (id, status) =>
  api.patch(`/banners/${id}/status`, {
    is_active: status,
  })