import React, { useState, useEffect } from 'react'
import { get_sell_listings, assign_listing, transfer_listing, reject_listing, get_merchants } from 'src/api/system_service'

const STATUS_MAP = {
    pending: { id: 1, color: 'warning', label: 'Pending' },
    assigned: { id: 2, color: 'info', label: 'Assigned' },
    rejected: { id: 3, color: 'danger', label: 'Rejected' },
    transferred: { id: 4, color: 'success', label: 'Transferred' },
}

const Listings = () => {
    const [tab, setTab] = useState('pending')
    const [listings, setListings] = useState([])
    const [merchants, setMerchants] = useState([])
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [assignModal, setAssignModal] = useState(null) // listing id being assigned
    const [selectedMerchant, setSelectedMerchant] = useState('')

    const fetchListings = async () => {
        try {
            setLoading(true)
            const statusId = STATUS_MAP[tab]?.id
            const res = await get_sell_listings(statusId)
            if (res.status === 200) setListings(res.data)
        } catch (e) {
            showToast('danger', 'Failed to load listings')
        } finally {
            setLoading(false)
        }
    }

    const fetchMerchants = async () => {
        try {
            const res = await get_merchants()
            if (res.status === 200) setMerchants(res.data)
        } catch (e) { /* ignore */ }
    }

    useEffect(() => { fetchListings() }, [tab])
    useEffect(() => { fetchMerchants() }, [])

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const handleAssign = async () => {
        if (!selectedMerchant || !assignModal) return
        try {
            await assign_listing(assignModal, selectedMerchant)
            showToast('success', 'Listing assigned to merchant')
            setAssignModal(null)
            setSelectedMerchant('')
            fetchListings()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to assign')
        }
    }

    const handleTransfer = async (id) => {
        if (!confirm('Mark this listing as transferred?')) return
        try {
            await transfer_listing(id)
            showToast('success', 'Listing transferred')
            fetchListings()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to transfer')
        }
    }

    const handleReject = async (id) => {
        if (!confirm('Reject this listing?')) return
        try {
            await reject_listing(id)
            showToast('success', 'Listing rejected')
            fetchListings()
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to reject')
        }
    }

    const tabs = [
        { key: 'pending', label: 'Pending Leads' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'transferred', label: 'Transferred' },
        { key: 'rejected', label: 'Rejected' },
    ]

    return (
        <div className="container py-4">
            {/* Toast */}
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 260 }}
                >
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Assign to Merchant</h6>
                                <button className="btn-close" onClick={() => { setAssignModal(null); setSelectedMerchant('') }} />
                            </div>
                            <div className="modal-body">
                                <select
                                    className="form-select"
                                    value={selectedMerchant}
                                    onChange={(e) => setSelectedMerchant(e.target.value)}
                                >
                                    <option value="">Select Merchant</option>
                                    {merchants.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.first_name} {m.last_name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary btn-sm" onClick={() => { setAssignModal(null); setSelectedMerchant('') }}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={!selectedMerchant}>Assign</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                    <h4 className="fw-bold mb-3 text-uppercase">Lead Management</h4>
                    <ul className="nav nav-tabs card-header-tabs">
                        {tabs.map(t => (
                            <li className="nav-item" key={t.key}>
                                <button
                                    className={`nav-link ${tab === t.key ? 'active' : ''}`}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr className="text-center">
                                        <th>#</th>
                                        <th>User</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Config</th>
                                        <th>Base Price</th>
                                        <th>Quoted</th>
                                        <th>Expected</th>
                                        <th>Status</th>
                                        {tab === 'assigned' && <th>Merchant</th>}
                                        {tab === 'transferred' && <th>Merchant</th>}
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.length > 0 ? listings.map((item, idx) => (
                                        <tr key={item.id} className="text-center">
                                            <td>{idx + 1}</td>
                                            <td>
                                                {item.first_name || item.last_name
                                                    ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
                                                    : item.user_email || '—'}
                                            </td>
                                            <td>{item.category || '—'}</td>
                                            <td>{item.brand || '—'}</td>
                                            <td>{item.model || '—'}</td>
                                            <td>{item.config_name || '—'}</td>
                                            <td>₹{Number(item.base_price || 0).toLocaleString()}</td>
                                            <td className="fw-semibold">₹{Number(item.quoted_price || 0).toLocaleString()}</td>
                                            <td>₹{Number(item.expected_price || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge bg-${STATUS_MAP[item.status_label]?.color || 'secondary'}`}>
                                                    {item.status_label || '—'}
                                                </span>
                                            </td>
                                            {(tab === 'assigned' || tab === 'transferred') && (
                                                <td>
                                                    {item.merchant_first_name
                                                        ? `${item.merchant_first_name} ${item.merchant_last_name || ''}`.trim()
                                                        : item.merchant_email || '—'}
                                                </td>
                                            )}
                                            <td className="small">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                                            <td>
                                                {tab === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary me-1"
                                                            onClick={() => setAssignModal(item.id)}
                                                        >
                                                            Assign
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleReject(item.id)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {tab === 'assigned' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-success me-1"
                                                            onClick={() => handleTransfer(item.id)}
                                                        >
                                                            Transfer
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleReject(item.id)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {tab === 'transferred' && (
                                                    <span className="text-muted small">Completed</span>
                                                )}
                                                {tab === 'rejected' && (
                                                    <span className="text-muted small">Rejected</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="14" className="text-center text-muted py-4">
                                                No listings found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Listings