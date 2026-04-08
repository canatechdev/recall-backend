import axios from 'axios'

import { emitAuthFailure } from '../auth/authEvents'
import { deleteCookie, getCookie, setCookie } from '../utils/cookies'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5500/'

const api = axios.create({
    baseURL,
    withCredentials: true,
})

const refreshClient = axios.create({
    baseURL,
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    if (!config?.skipAuth) {
        const token = getCookie('accessToken')
        if (token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`
        }
    }
    return config
})

let isRefreshing = false
let refreshQueue = []

const flushQueue = (error, accessToken) => {
    refreshQueue.forEach(({ resolve, reject, originalRequest }) => {
        if (error) {
            reject(error)
            return
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        resolve(api(originalRequest))
    })
    refreshQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status
        const originalRequest = error?.config

        if (!originalRequest || originalRequest.skipAuthRefresh) {
            return Promise.reject(error)
        }

        if (status !== 401) {
            return Promise.reject(error)
        }

        if (originalRequest._retry) {
            deleteCookie('accessToken')
            emitAuthFailure()
            return Promise.reject(error)
        }

        originalRequest._retry = true

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject, originalRequest })
            })
        }

        isRefreshing = true
        try {
            const res = await refreshClient.post('auth/refresh')
            const newAccessToken = res?.data?.accessToken
            if (!newAccessToken) throw new Error('Refresh did not return accessToken')

            setCookie('accessToken', newAccessToken, {
                path: '/',
                // keep short-ish; backend governs actual expiry
                maxAge: 60 * 60,
                sameSite: 'Strict',
                secure: false,
            })

            flushQueue(null, newAccessToken)
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return api(originalRequest)
        } catch (refreshError) {
            flushQueue(refreshError)
            deleteCookie('accessToken')
            emitAuthFailure()
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    },
)

export default api