import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import logo from '../assets/brand/Recello_logo.png'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const sidebarColorScheme = useSelector((state) => state.sidebarColorScheme || 'auto')
  const { colorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const resolvedBaseScheme = (() => {
    if (colorMode === 'dark') return 'dark'
    if (colorMode === 'light') return 'light'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })()

  const resolvedColorScheme = sidebarColorScheme === 'auto' ? resolvedBaseScheme : sidebarColorScheme

  return (
    <CSidebar
      className="border-end"
      colorScheme={resolvedColorScheme}
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom d-flex justify-content-center align-items-center">
        {/* <CSidebarBrand to="/" className="d-flex align-items-center justify-content-center"> */}
          <img
            src={logo}
            alt="Resello"
            className="sidebar-brand-full"
            style={{ display: 'inline', maxHeight: 50, maxWidth: 200, width: 'auto', objectFit: 'contain' }}
          />
          {/* <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} /> */}
        {/* </CSidebarBrand> */}
        {/* <CCloseButton
          className="d-lg-none"
          dark={resolvedColorScheme === 'dark'}
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        /> */}
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
