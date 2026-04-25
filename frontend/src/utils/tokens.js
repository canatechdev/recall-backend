const REFRESH_TOKEN_KEY = 'refreshToken'

export const getRefreshToken = () => {
    if (typeof window === 'undefined') return null
    try {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
        return null
    }
}

export const setRefreshToken = (token) => {
    if (typeof window === 'undefined') return
    try {
        if (!token) {
            window.localStorage.removeItem(REFRESH_TOKEN_KEY)
            return
        }
        window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } catch {
        // ignore
    }
}

export const clearRefreshToken = () => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
        // ignore
    }
}
