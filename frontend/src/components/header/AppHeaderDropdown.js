import React, { useMemo } from 'react'
import { useAuth } from 'src/context/AuthContext'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/avatars/7.jpg'

const AppHeaderDropdown = () => {
  const { user, logout } = useAuth()

  const avatarSrc = useMemo(() => {
    const fileName = user?.avatar_url
    if (!fileName) return null
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5500/').replace(/\/+$/, '')
    return `${base}/uploads/${fileName}`
  }, [user])

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatarSrc || avatar8} size="md" />
        {/* <CIcon icon={cilUser} className="mt-2" /> */}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem href="#">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem as="button" type="button" onClick={logout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Log Out
          {/* <CBadge color="info" className="ms-2">
            42
          </CBadge> */}
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
