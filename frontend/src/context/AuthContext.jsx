import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from 'src/api/auth.api'
import { onAuthFailure } from 'src/auth/authEvents'
import { deleteCookie, getCookie, setCookie } from 'src/utils/cookies'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const accessToken = getCookie('accessToken')
  const isAuthenticated = Boolean(accessToken)

  const login = async ({ email, password }) => {
    const res = await authApi.login({ email, password })
    const token = res?.data?.accessToken
    if (token) {
      setCookie('accessToken', token, { path: '/', maxAge: 60 * 60, sameSite: 'Strict', secure: false })
    }
    setUser(res?.data?.user || null)
    return res
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      deleteCookie('accessToken')
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  useEffect(() => {
    const unsub = onAuthFailure(() => {
      deleteCookie('accessToken')
      setUser(null)
      navigate('/login', { replace: true })
    })
    return unsub
  }, [navigate])

  useEffect(() => {
    const init = async () => {
      try {
        // If accessToken exists, consider session active; otherwise try refresh via httpOnly refreshToken.
        if (getCookie('accessToken')) {
          setLoading(false)
          return
        }

        const res = await authApi.refresh()
        const token = res?.data?.accessToken
        if (token) {
          setCookie('accessToken', token, { path: '/', maxAge: 60 * 60, sameSite: 'Strict', secure: false })
        }
      } catch {
        // no session
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, loading, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
