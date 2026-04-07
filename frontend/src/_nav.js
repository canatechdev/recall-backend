import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cil3d,
  cilArrowRight,
  cilArrowThickFromRight,
  cilArrowThickToRight,
  cilArrowThickToTop,
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilList,
  cilNotes,
  cilPencil,
  cilPlus,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
  cilTransfer,
  cilTrash,
  cilUserPlus,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavTitle,
    name: 'User Management',
  },
  {
    component: CNavItem,
    name: 'All Users',
    to: '/users',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Add User',
    to: '/users/add',
    icon: <CIcon icon={cilUserPlus} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Lead Management',
  },
  {
    component: CNavItem,
    name: 'Transfer Leads',
    to: '/leads',
    icon: <CIcon icon={cilTransfer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Rejected Leads',
    to: '/leads/rejected',
    icon: <CIcon icon={cilTrash} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Inventory Management',
  },
  {
    component: CNavGroup,
    name: 'Products',
    to: '/products',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Products',
        to: '/products',
      },
      // {
      //   component: CNavItem,
      //   name: 'Add Product',
      //   to: '/products/add',
      // },
    ]
  },
  {
    component: CNavGroup,
    name: 'Services',
    to: '/services',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Services',
        to: '/services/manage',
      },
    ]
  },
  {
    component: CNavGroup,
    name: 'Categories',
    to: '/categories',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Categories',
        to: '/categories/manage',
      }
    ]
  },
  {
    component: CNavGroup,
    name: 'Brands',
    to: '/brands',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Brands',
        to: '/brands/manage',
      }
    ]
  },
  {
    component: CNavGroup,
    name: 'Series',
    to: '/series',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Series & Models',
        to: '/models/manage',
      }
    ]
  },
  {
    component: CNavGroup,
    name: 'Sell Flow',
    to: '/sell',
    icon: <CIcon icon={cilArrowThickToTop} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Sell Questions',
        to: '/sell/questions',
      },
    ]
  },
  {
    component: CNavGroup,
    name: 'Orders',
    to: '/buttons',
    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Pending Orders',
        to: '/buttons/buttons',
      },
      {
        component: CNavItem,
        name: 'Delivered Orders',
        to: '/buttons/button-groups',
      },
      {
        component: CNavItem,
        name: 'Cancelled Orders',
        to: '/buttons/dropdowns',
      },

    ]
  },
  {
    component: CNavTitle,
    name: 'System Management',
  },
  {
    component: CNavGroup,
    name: 'Banners',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Banner',
        to: '/banners',
      }
    ]
  },
  {
    component: CNavGroup,
    name: 'Faqs',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Faq',
        to: '/faqs',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Categories',
    href: 'https://coreui.io/react/docs/templates/installation/',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
]

export default _nav
