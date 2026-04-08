import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CSpinner } from '@coreui/react'

import { useAuth } from './AuthContext'

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
