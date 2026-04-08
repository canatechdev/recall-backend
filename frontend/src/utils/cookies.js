export const getCookie = (name) => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export const setCookie = (name, value, options = {}) => {
  if (typeof document === 'undefined') return
  const {
    path = '/',
    maxAge, // seconds
    sameSite = 'Strict',
    secure = false,
  } = options

  let cookie = `${name}=${encodeURIComponent(value ?? '')}; Path=${path}; SameSite=${sameSite}`
  if (typeof maxAge === 'number') cookie += `; Max-Age=${maxAge}`
  if (secure) cookie += '; Secure'
  document.cookie = cookie
}

export const deleteCookie = (name, options = {}) => {
  setCookie(name, '', { ...options, maxAge: 0 })
}
