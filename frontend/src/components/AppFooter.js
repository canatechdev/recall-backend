import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div className="d-flex ">
        <p className="my-auto" rel="noopener noreferrer">
          Copyright
        </p>
        <span className="ms-1 my-auto">&copy; 2026 Resello.</span>
      </div>
      <div className="ms-auto d-flex ">
        <span className="me-1 my-auto">Powered by</span>
        <small className="my-auto text-uppercase fw-bold" rel="noopener noreferrer">
          Canatech pvt ltd 
        </small>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
