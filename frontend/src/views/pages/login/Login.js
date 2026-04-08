import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'

import { logo } from 'src/assets/brand/logo'

import { useAuth } from 'src/context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      await login({ email, password })
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
                  <CIcon icon={logo} height={36} className="text-primary" />
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
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </CInputGroup>
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
