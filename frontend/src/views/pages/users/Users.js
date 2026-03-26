import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CIcon } from '@coreui/icons-react'
import { cilPlus, cilTrash, cilReload, cilCheck, cilX, cilShieldAlt } from '@coreui/icons'
import { get_users, delete_user, add_merchant_role, remove_merchant_role, update_user_status } from "src/api/system_service"

const STATUS_LABELS = {
    1: { label: "Active", badge: "success" },
    2: { label: "Suspended", badge: "warning" },
    3: { label: "Deleted", badge: "danger" },
}

const Users = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await get_users()
            if (res.status === 200) setUsers(res.data)
        } catch (e) {
            showToast('danger', 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    const handleDelete = async (u) => {
        if (!confirm(`Delete user "${u.email}"?`)) return
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
        if (!confirm(`${action} "${u.email}"?`)) return
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
        if (!confirm(`${action} user "${u.email}"?`)) return
        try {
            await update_user_status(u.id, newStatus)
            showToast('success', `User ${newStatus === 1 ? 'activated' : 'suspended'}`)
            fetchUsers()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to update status')
        }
    }

    return (
        <div className="container py-4">
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 260 }}
                >
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold text-uppercase mb-0">Users</h4>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={fetchUsers} disabled={loading} title="Refresh">
                            <CIcon icon={cilReload} />
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/users/add')}>
                            <CIcon icon={cilPlus} className="me-1" /> Add User
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary" />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr className="text-center">
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Roles</th>
                                        <th>Status</th>
                                        <th>Merchant</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? users.map((u, idx) => {
                                        const statusInfo = STATUS_LABELS[u.status] || { label: '—', badge: 'secondary' }
                                        return (
                                            <tr key={u.id} className="text-center">
                                                <td>{idx + 1}</td>
                                                <td>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'}</td>
                                                <td>{u.email}</td>
                                                <td>{u.phone || '—'}</td>
                                                <td>
                                                    {u.roles
                                                        ? u.roles.split(', ').map(r => (
                                                            <span key={r} className="badge bg-secondary me-1">{r}</span>
                                                        ))
                                                        : <span className="text-muted small">None</span>
                                                    }
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${statusInfo.badge}`}>{statusInfo.label}</span>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${u.is_merchant ? 'btn-success' : 'btn-outline-secondary'}`}
                                                        onClick={() => handleMerchantToggle(u)}
                                                        title={u.is_merchant ? 'Remove merchant role' : 'Grant merchant role'}
                                                    >
                                                        <CIcon icon={cilShieldAlt} className="me-1" />
                                                        {u.is_merchant ? 'Merchant' : 'Set'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <button
                                                            className={`btn btn-sm ${u.status === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                            onClick={() => handleStatusToggle(u)}
                                                            title={u.status === 1 ? 'Suspend user' : 'Activate user'}
                                                        >
                                                            <CIcon icon={u.status === 1 ? cilX : cilCheck} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(u)}
                                                            title="Delete user"
                                                        >
                                                            <CIcon icon={cilTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="8" className="text-center text-muted py-4">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="text-muted small mt-2">
                        Total: <strong>{users.length}</strong> user{users.length !== 1 ? 's' : ''}
                        {users.filter(u => u.is_merchant).length > 0 && (
                            <span className="ms-3">
                                Merchants: <strong>{users.filter(u => u.is_merchant).length}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Users
