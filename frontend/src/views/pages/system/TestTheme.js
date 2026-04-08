import React, { useMemo, useState } from 'react'
import { CAvatar, CBadge, CFormInput, CFormSelect } from '@coreui/react'
import ThemedTablePage from 'src/components/ThemedTablePage'

const STATUS_LABELS = {
  1: { label: 'Active', badge: 'success' },
  2: { label: 'Inactive', badge: 'secondary' },
  3: { label: 'Blocked', badge: 'danger' },
}

const isMerchantUser = (user) => Boolean(user?.is_merchant)

const safeName = (user) => {
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
  return fullName || user?.email || '—'
}

const formatJoinedDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

const demoUsers = [
  {
    id: 1,
    first_name: 'Sarah',
    last_name: 'Connor',
    email: 'sarah.c@recello.io',
    status: 1,
    is_merchant: false,
    created_at: '2023-10-24T00:00:00.000Z',
  },
  {
    id: 2,
    first_name: 'Marcus',
    last_name: 'Wright',
    email: 'm.wright@recello.io',
    status: 1,
    is_merchant: true,
    created_at: '2023-11-12T00:00:00.000Z',
  },
  {
    id: 3,
    first_name: 'Elena',
    last_name: 'Fisher',
    email: 'efisher@recello.io',
    status: 2,
    is_merchant: false,
    created_at: '2023-12-01T00:00:00.000Z',
  },
  {
    id: 4,
    first_name: 'David',
    last_name: 'Miller',
    email: 'd.miller@recello.io',
    status: 1,
    is_merchant: true,
    created_at: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 5,
    first_name: 'Chloe',
    last_name: 'Sims',
    email: 'c.sims@recello.io',
    status: 3,
    is_merchant: false,
    created_at: '2024-02-03T00:00:00.000Z',
  },
]

const TestTheme = () => {
  const [activeType, setActiveType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const tabs = [
    { key: 'all', label: 'All Users' },
    { key: 'users', label: 'Users' },
    { key: 'merchants', label: 'Merchants' },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return demoUsers
      .filter((u) => {
        if (activeType === 'merchants') return isMerchantUser(u)
        if (activeType === 'users') return !isMerchantUser(u)
        return true
      })
      .filter((u) => {
        if (statusFilter === 'all') return true
        return String(u.status) === String(statusFilter)
      })
      .filter((u) => {
        if (!q) return true
        const haystack = `${safeName(u)} ${u.email || ''}`.toLowerCase()
        return haystack.includes(q)
      })
  }, [activeType, statusFilter, query])

  const columns = [
    {
      key: 'details',
      label: 'User Details',
      render: (u) => {
        const statusInfo = STATUS_LABELS[u.status] || { badge: 'secondary' }
        return (
          <div className="d-flex align-items-center">
            <CAvatar size="md" src={`https://i.pravatar.cc/150?u=${u.id}`} status={statusInfo.badge} />
            <div className="ms-3">
              <div className="fw-semibold">{safeName(u)}</div>
              <div className="small text-medium-emphasis">{u.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      label: 'Role',
      render: (u) => (isMerchantUser(u) ? 'user + merchant' : 'user'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (u) => {
        const statusInfo = STATUS_LABELS[u.status] || { label: '—', badge: 'secondary' }
        return (
          <CBadge color={statusInfo.badge} shape="rounded-pill">
            {statusInfo.label}
          </CBadge>
        )
      },
    },
    {
      key: 'joined',
      label: 'Joined Date',
      render: (u) => formatJoinedDate(u.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => null,
    },
  ]

  const footerLeft = (
    <div className="small text-medium-emphasis">Showing 1-{filtered.length} of {filtered.length} users</div>
  )

  const filtersContent = (
    <div className="d-grid gap-2">
      <div>
        <div className="small text-medium-emphasis mb-1">Search</div>
        <CFormInput
          size="sm"
          placeholder="Search name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div>
        <div className="small text-medium-emphasis mb-1">Status</div>
        <CFormSelect
          size="sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="1">Active</option>
          <option value="2">Inactive</option>
          <option value="3">Blocked</option>
        </CFormSelect>
      </div>
    </div>
  )

  return (
    <ThemedTablePage
      tabs={tabs}
      activeTabKey={activeType}
      onTabChange={setActiveType}
      actions={{
        filtersContent,
        onExport: null,
      }}
      columns={columns}
      rows={filtered}
      rowKey={(u) => u.id}
      footerLeft={footerLeft}
      pagination={{
        page: 1,
        totalPages: 25,
        onChange: () => { },
      }}
    />
  )
}

export default TestTheme