import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAvatar, CBadge, CButton, CFormInput, CFormSelect } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilCheck, cilX, cilShieldAlt, cilPlus } from '@coreui/icons'

import {
    add_merchant_role,
    delete_user,
    get_users,
    remove_merchant_role,
    update_user_status,
} from 'src/api/system_service'
import ThemedTablePage from 'src/components/ThemedTablePage'

const STATUS_LABELS = {
    1: { label: 'Active', badge: 'success' },
    2: { label: 'Suspended', badge: 'warning' },
    3: { label: 'Deleted', badge: 'danger' },
}

const isMerchantUser = (user) => {
    if (!user) return false
    if (user.is_merchant) return true
    const roles = typeof user.roles === 'string' ? user.roles.toLowerCase() : ''
    return roles.includes('merchant')
}

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

const downloadCsv = ({ filename, rows }) => {
    const escapeCell = (cell) => {
        const str = String(cell ?? '')
        if (/[\",\n]/.test(str)) return `\"${str.replaceAll('\"', '\"\"')}\"`
        return str
    }

    const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

const Users = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    const [activeType, setActiveType] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [query, setQuery] = useState('')

    const [page, setPage] = useState(1)
    const pageSize = 5

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await get_users()
            if (res.status === 200) setUsers(res.data)
        } catch {
            showToast('danger', 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (u) => {
        if (!window.confirm(`Delete user \"${u.email}\"?`)) return
        try {
            await delete_user(u.id)
            showToast('success', 'User deleted')
            fetchUsers()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to delete user')
        }
    }

    const handleMerchantToggle = async (u) => {
        const action = u.is_merchant ? 'Remove merchant role from' : 'Make merchant:'
        if (!window.confirm(`${action} \"${u.email}\"?`)) return
        try {
            if (u.is_merchant) {
                await remove_merchant_role(u.id)
                showToast('success', 'Merchant role removed')
            } else {
                await add_merchant_role(u.id)
                showToast('success', `${u.email} is now a merchant`)
            }
            fetchUsers()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to update role')
        }
    }

    const handleStatusToggle = async (u) => {
        const newStatus = u.status === 1 ? 2 : 1
        const action = newStatus === 1 ? 'Activate' : 'Suspend'
        if (!window.confirm(`${action} user \"${u.email}\"?`)) return
        try {
            await update_user_status(u.id, newStatus)
            showToast('success', `User ${newStatus === 1 ? 'activated' : 'suspended'}`)
            fetchUsers()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to update status')
        }
    }

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase()

        return users
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
    }, [users, activeType, statusFilter, query])

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const pageStartIndex = (safePage - 1) * pageSize
    const pageEndIndex = Math.min(filteredUsers.length, pageStartIndex + pageSize)
    const pagedUsers = filteredUsers.slice(pageStartIndex, pageEndIndex)

    useEffect(() => {
        setPage(1)
    }, [activeType, statusFilter, query])

    const tabs = [
        { key: 'all', label: 'All Users' },
        { key: 'users', label: 'Users' },
        { key: 'merchants', label: 'Merchants' },
    ]

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
            render: (u) => {
                const roles = typeof u.roles === 'string' ? u.roles.split(',').map((r) => r.trim()) : []
                const primaryRole =
                    roles.find((r) => r && !['user', 'merchant'].includes(r.toLowerCase())) ||
                    (isMerchantUser(u) ? 'Merchant' : 'User')
                return (
                    <div>
                        <div>{primaryRole}</div>
                        {isMerchantUser(u) && <div className="small text-medium-emphasis">user + merchant</div>}
                    </div>
                )
            },
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
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (u) => (
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <CButton
                        size="sm"
                        color={u.is_merchant ? 'success' : 'light'}
                        variant={u.is_merchant ? undefined : 'outline'}
                        onClick={() => handleMerchantToggle(u)}
                        title={u.is_merchant ? 'Remove merchant role' : 'Grant merchant role'}
                    >
                        <CIcon icon={cilShieldAlt} />
                    </CButton>

                    <CButton
                        size="sm"
                        color={u.status === 1 ? 'warning' : 'success'}
                        variant="outline"
                        onClick={() => handleStatusToggle(u)}
                        title={u.status === 1 ? 'Suspend user' : 'Activate user'}
                    >
                        <CIcon icon={u.status === 1 ? cilX : cilCheck} />
                    </CButton>

                    <CButton
                        size="sm"
                        color="danger"
                        variant="outline"
                        onClick={() => handleDelete(u)}
                        title="Delete user"
                    >
                        <CIcon icon={cilTrash} />
                    </CButton>
                </div>
            ),
        },
    ]

    const footerLeft = (
        <div className="small text-medium-emphasis">
            Showing {filteredUsers.length ? pageStartIndex + 1 : 0}-{pageEndIndex} of {filteredUsers.length} users
        </div>
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
                    <option value="2">Suspended</option>
                    <option value="3">Deleted</option>
                </CFormSelect>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-1">
                <CButton
                    size="sm"
                    color="light"
                    onClick={() => {
                        setQuery('')
                        setStatusFilter('all')
                    }}
                >
                    Reset
                </CButton>
            </div>
        </div>
    )

    const handleExport = () => {
        downloadCsv({
            filename: `users_${activeType}_${new Date().toISOString().slice(0, 10)}.csv`,
            rows: [
                ['Name', 'Email', 'Status', 'Merchant'],
                ...filteredUsers.map((u) => {
                    const statusInfo = STATUS_LABELS[u.status] || { label: '—' }
                    return [safeName(u), u.email || '', statusInfo.label, isMerchantUser(u) ? 'yes' : 'no']
                }),
            ],
        })
    }

    return (
        <div>
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 260 }}
                >
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            <ThemedTablePage
                tabs={tabs}
                activeTabKey={activeType}
                onTabChange={setActiveType}
                actions={{
                    filtersContent,
                    onExport: handleExport,
                    primary: {
                        label: 'Create User',
                        color: 'success',
                        onClick: () => navigate('/users/add'),
                        icon: <CIcon icon={cilPlus} />,
                    },
                }}
                columns={columns}
                rows={pagedUsers}
                rowKey={(u) => u.id}
                loading={loading}
                emptyText="No users found"
                footerLeft={footerLeft}
                pagination={{
                    page: safePage,
                    totalPages,
                    onChange: (p) => setPage(p),
                }}
            />
        </div>
    )
}

export default Users
