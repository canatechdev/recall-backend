import axios from 'axios'

const uploadApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5500/api',
})

export const getBanners = () => uploadApi.get('/banners')

export const createBanner = (formData) => uploadApi.post('/banners', formData)

export const deleteBanner = (id) => uploadApi.delete(`/banners/${id}`)

export const getBannerById = (id) => uploadApi.get(`/banners/${id}`)

export const updateBanner = (id, formData) => uploadApi.put(`/banners/${id}`, formData)

export const toggleBannerStatus = (id, status) => {
  return uploadApi.patch(`/banners/${id}/status`, {
    is_active: status,
  })
}