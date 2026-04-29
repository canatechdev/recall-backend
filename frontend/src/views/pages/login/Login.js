import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CFormCheck,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilLowVision, cilMagnifyingGlass, cilUser } from '@coreui/icons'

import logo from '../../../assets/brand/Recello_logo.png'

import { useAuth } from 'src/context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const rememberKey = 'resello_admin_login'

  useEffect(() => {
    const raw = localStorage.getItem(rememberKey)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved?.email) setEmail(String(saved.email))
      if (saved?.password) setPassword(String(saved.password))
      if (saved?.remember) setRememberMe(true)
    } catch {
      // ignore
    }
  }, [])

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      await login({ email, password })

      if (rememberMe) {
        localStorage.setItem(
          rememberKey,
          JSON.stringify({ email: email || '', password: password || '', remember: true }),
        )
      } else {
        localStorage.removeItem(rememberKey)
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol sm={10} md={7} lg={5} xl={4}>
            <CCard className="border-0 shadow-sm">
              <CCardBody className="p-4">
                <div className="text-center mb-4">
                  {/* <CIcon icon={logo} height={36} className="text-primary" /> */}
                  {/* <img
                    src={logo}
                    alt="Resello"
                    style={{ display: 'block', maxWidth: 180, width: '100%', height: 'auto', margin: '0 auto' }}
                  /> */}
                  <div className="h4 fw-bold mt-3 mb-1">Admin Login</div>
                  <div className="text-body-secondary small">Sign in to continue</div>
                </div>

                <CForm onSubmit={handleSubmit}>

                  {error ? (
                    <div className="alert alert-danger py-2">{error}</div>
                  ) : null}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <CInputGroupText
                      role="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <CIcon icon={showPassword ? cilLowVision : cilMagnifyingGlass} />
                    </CInputGroupText>
                  </CInputGroup>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <CFormCheck
                      id="rememberMe"
                      label="Remember me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  </div>

                  <CRow>
                    <CCol xs={12} className="text-center">
                      <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                        {loading ? 'Logging in…' : 'Login'}
                      </CButton>
                    </CCol>
                    {/* <CCol xs={6} className="text-right">
                      <CButton color="link" className="px-0">
                        Forgot password?
                      </CButton>
                    </CCol> */}
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
