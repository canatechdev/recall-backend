import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    get_sell_listings,
    get_sell_listing_details,
    assign_listing,
    transfer_listing,
    reject_listing,
    get_merchants,
} from 'src/api/system_service'
import ThemedTablePage from 'src/components/ThemedTablePage'
import {
    CButton,
    CDropdown,
    CDropdownItem,
    CDropdownMenu,
    CDropdownToggle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilOptions, cilUser, cilX } from '@coreui/icons'

const STATUS_MAP = {
    pending: { id: 1, color: 'warning', label: 'Pending' },
    assigned: { id: 2, color: 'info', label: 'Assigned' },
    rejected: { id: 3, color: 'danger', label: 'Rejected' },
    transferred: { id: 4, color: 'success', label: 'Completed' },
}

const Listings = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const routeTab = useMemo(() => {
        // keep it simple: /leads => pending, /leads/rejected => rejected
        const p = (location?.pathname || '').toLowerCase()
        if (p.includes('/leads/rejected')) return 'rejected'
        return 'pending'
    }, [location?.pathname])

    const [tab, setTab] = useState(routeTab)
    const [listings, setListings] = useState([])
    const [merchants, setMerchants] = useState([])
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [assignModal, setAssignModal] = useState(null) // listing id being assigned
    const [selectedMerchant, setSelectedMerchant] = useState('')
    const [detailsId, setDetailsId] = useState(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [details, setDetails] = useState(null)

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

    useEffect(() => {
        setTab(routeTab)
    }, [routeTab])

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
        { key: 'transferred', label: 'Completed' },
        { key: 'rejected', label: 'Rejected' },
    ]

    const onTabChange = (key) => {
        setTab(key)
        // keep existing routes behaviour but ensure UI can switch
        if (key === 'rejected') navigate('/leads/rejected')
        else navigate('/leads')
    }

    const openDetails = async (id) => {
        if (!id) return
        try {
            setDetailsId(id)
            setDetails(null)
            setDetailsLoading(true)
            const res = await get_sell_listing_details(id)
            if (res.status === 200) setDetails(res.data)
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to load details')
        } finally {
            setDetailsLoading(false)
        }
    }

    const rows = listings.map((item, idx) => ({ ...item, _rowIndex: idx + 1 }))

    const columns = [
        {
            key: '_rowIndex',
            label: '#',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            headerStyle: { width: 70 },
            render: (item) => item._rowIndex,
        },
        {
            key: 'user',
            label: 'User',
            render: (item) =>
                item.first_name || item.last_name
                    ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
                    : item.user_email || '—',
        },
        { key: 'category', label: 'Category', render: (item) => item.category || '—' },
        { key: 'brand', label: 'Brand', render: (item) => item.brand || '—' },
        { key: 'model', label: 'Model', render: (item) => item.model || '—' },
        { key: 'config', label: 'Config', render: (item) => item.config_name || '—' },
        {
            key: 'base',
            label: 'Base Price',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (item) => `₹${Number(item.base_price || 0).toLocaleString()}`,
        },
        {
            key: 'quoted',
            label: 'Quoted',
            headerClassName: 'text-center',
            cellClassName: 'text-center fw-semibold',
            render: (item) => `₹${Number(item.quoted_price || 0).toLocaleString()}`,
        },
        {
            key: 'expected',
            label: 'Expected',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (item) => `₹${Number(item.expected_price || 0).toLocaleString()}`,
        },
        {
            key: 'status',
            label: 'Status',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (item) => (
                <span className={`badge bg-${STATUS_MAP[item.status_label]?.color || 'secondary'}`}>
                    {item.status_label || '—'}
                </span>
            ),
        },
        ...(tab === 'assigned' || tab === 'transferred'
            ? [
                {
                    key: 'merchant',
                    label: 'Merchant',
                    render: (item) =>
                        item.merchant_first_name
                            ? `${item.merchant_first_name} ${item.merchant_last_name || ''}`.trim()
                            : item.merchant_email || '—',
                },
            ]
            : []),
        {
            key: 'date',
            label: 'Date',
            headerClassName: 'text-center',
            cellClassName: 'text-center small',
            render: (item) => (item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'),
        },
        {
            key: 'action',
            label: 'Action',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (item) => (
                <>
                    <CDropdown alignment="end">
                        <CDropdownToggle
                            color="light"
                            size="sm"
                            className="border"
                            caret={false}
                            title="Actions"
                        >
                            <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                            <CDropdownItem as="button" type="button" onClick={() => openDetails(item.id)}>
                                <CIcon icon={cilUser} className="me-2" />
                                View Details
                            </CDropdownItem>

                            {(tab === 'pending') && (
                                <>
                                    <CDropdownItem as="button" type="button" onClick={() => setAssignModal(item.id)}>
                                        Assign
                                    </CDropdownItem>
                                    <CDropdownItem as="button" type="button" onClick={() => handleReject(item.id)} className="text-danger">
                                        Reject
                                    </CDropdownItem>
                                </>
                            )}

                            {(tab === 'assigned') && (
                                <>
                                    <CDropdownItem as="button" type="button" onClick={() => handleTransfer(item.id)} className="text-success">
                                        Transfer
                                    </CDropdownItem>
                                    <CDropdownItem as="button" type="button" onClick={() => handleReject(item.id)} className="text-danger">
                                        Reject
                                    </CDropdownItem>
                                </>
                            )}

                            {(tab === 'transferred') && (
                                <CDropdownItem disabled>Completed</CDropdownItem>
                            )}
                            {(tab === 'rejected') && (
                                <CDropdownItem disabled>Rejected</CDropdownItem>
                            )}
                        </CDropdownMenu>
                    </CDropdown>
                </>
            ),
        },
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

            {/* Details Modal */}
            {detailsId && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h6 className="modal-title mb-0">Lead Details</h6>
                                    <div className="small text-medium-emphasis">#{detailsId}</div>
                                </div>
                                <button className="btn-close" onClick={() => { setDetailsId(null); setDetails(null) }} />
                            </div>
                            <div className="modal-body">
                                {detailsLoading ? (
                                    <div className="d-flex justify-content-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" />
                                    </div>
                                ) : !details ? (
                                    <div className="text-muted">No details found.</div>
                                ) : (
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <div className="border rounded p-3 bg-body-tertiary">
                                                <div className="fw-semibold mb-2">User</div>
                                                <div className="small">
                                                    <div><span className="text-medium-emphasis">Name:</span> {`${details.user?.first_name || ''} ${details.user?.last_name || ''}`.trim() || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Email:</span> {details.user?.email || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Phone:</span> {details.user?.phone || '—'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <div className="border rounded p-3 bg-body-tertiary">
                                                <div className="fw-semibold mb-2">Device</div>
                                                <div className="small">
                                                    <div><span className="text-medium-emphasis">Category:</span> {details.category?.name || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Brand:</span> {details.brand?.name || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Series:</span> {details.series?.name || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Model:</span> {details.model?.name || '—'}</div>
                                                    <div><span className="text-medium-emphasis">Config:</span> {details.config?.name || '—'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="border rounded p-3">
                                                <div className="fw-semibold mb-2">Pricing</div>
                                                <div className="row small">
                                                    <div className="col-6 col-md-4"><span className="text-medium-emphasis">Base:</span> ₹{Number(details.listing?.base_price || 0).toLocaleString()}</div>
                                                    <div className="col-6 col-md-4"><span className="text-medium-emphasis">Quoted:</span> ₹{Number(details.listing?.quoted_price || 0).toLocaleString()}</div>
                                                    <div className="col-6 col-md-4"><span className="text-medium-emphasis">Expected:</span> ₹{Number(details.listing?.expected_price || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="border rounded p-3">
                                                <div className="fw-semibold mb-2">Answers</div>
                                                {details.answers?.length ? (
                                                    <div className="d-grid gap-2">
                                                        {details.answers.map((a) => (
                                                            <div key={a.question_id} className="border rounded p-2 bg-body-tertiary">
                                                                <div className="small fw-semibold">{a.text}</div>
                                                                <div className="small text-medium-emphasis">
                                                                    {(a.options || []).map((o) => o.text).filter(Boolean).join(', ') || '—'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small">No answers recorded.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="border rounded p-3">
                                                <div className="fw-semibold mb-2">Pickup</div>
                                                {!details.pickup ? (
                                                    <div className="text-muted small">No pickup scheduled.</div>
                                                ) : (
                                                    <div className="row small">
                                                        <div className="col-6 col-md-4"><span className="text-medium-emphasis">Date:</span> {details.pickup.pickup_date ? new Date(details.pickup.pickup_date).toLocaleDateString() : '—'}</div>
                                                        <div className="col-6 col-md-4"><span className="text-medium-emphasis">Slot:</span> {details.pickup.pickup_slot_start || '—'} - {details.pickup.pickup_slot_end || '—'}</div>
                                                        <div className="col-6 col-md-4"><span className="text-medium-emphasis">Status:</span> {details.pickup.status_label || details.pickup.status || '—'}</div>
                                                        <div className="col-12 mt-2">
                                                            <span className="text-medium-emphasis">Address:</span>{' '}
                                                            {details.pickup.address
                                                                ? `${details.pickup.address.line1 || ''}${details.pickup.address.city ? ', ' + details.pickup.address.city : ''}${details.pickup.address.state ? ', ' + details.pickup.address.state : ''}${details.pickup.address.pincode ? ' - ' + details.pickup.address.pincode : ''}`
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <CButton color="light" className="border" onClick={() => { setDetailsId(null); setDetails(null) }}>
                                    <CIcon icon={cilX} className="me-2" /> Close
                                </CButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ThemedTablePage
                tabs={tabs}
                activeTabKey={tab}
                onTabChange={onTabChange}
                actions={{
                    onExport: null,
                }}
                topContent={
                    <div className="mb-3">
                        <h4 className="fw-bold mb-0 text-uppercase">Lead Management</h4>
                    </div>
                }
                columns={columns}
                rows={rows}
                rowKey={(item) => item.id}
                loading={loading}
                emptyText="No listings found"
            />
        </div>
    )
}

export default Listings