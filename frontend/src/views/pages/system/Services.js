import React, { useEffect, useMemo, useState } from 'react'
import { get_services_all, create_service, toggle_service, update_service } from "src/api/system_service"
import CIcon from '@coreui/icons-react'
import { cilNoteAdd, cilPlus, cilX } from '@coreui/icons'
import ThemedTablePage from 'src/components/ThemedTablePage'

const Services = () => {
    const [services, setServices] = useState([])
    const [isService, setIsService] = useState(false)
    const [toast, setToast] = useState(null)

    const [name, setName] = useState("")
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState('')
    const [isEdit, setIsEdit] = useState(false)
    const [editId, setEditId] = useState(null)

    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // all | enabled | suspended

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3500)
    }

    const toggleService = () => {
        setIsService(!isService)
        setIsEdit(false)
        setEditId(null)
        setName('')
        setFile(null)
        setUrl('')
    }

    const editService = ({ id, name, url }) => {
        if (!id || !name || !url) return showToast('danger', 'Invalid Service')
        setIsService(true)
        setIsEdit(true)
        setEditId(id)
        setName(name)
        setUrl(url)
        setFile(null)
    }

    const fetchServices = async () => {
        try {
            const response = await get_services_all()
            if (response.status === 200) setServices(response.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const createServiceHandler = async () => {
        if (!name || !file) return showToast('danger', 'Service name & Image are required')
        if (confirm(`Is spelled "${name}" correct?`)) {
            try {
                const formData = new FormData()
                formData.append('name', name)
                formData.append('image', file)
                await create_service(formData)
                showToast('success', 'Service created successfully!')
                fetchServices()
                toggleService()
            } catch (err) {
                showToast('danger', err.response?.data?.message || 'Failed to create service.')
            }
        }
    }

    const updateServiceHandler = async () => {
        if (!editId) return showToast('danger', 'Invalid Service')
        if (!name) return showToast('danger', 'Service name is required')
        if (confirm(`Update to "${name}"?`)) {
            try {
                const formData = new FormData()
                formData.append('name', name)
                if (file) formData.append('image', file)
                await update_service(editId, formData)
                showToast('success', 'Service updated successfully!')
                fetchServices()
                toggleService()
            } catch (err) {
                showToast('danger', err.response?.data?.message || 'Failed to update service.')
            }
        }
    }

    const handleSubmit = () => {
        if (isEdit) updateServiceHandler();
        else createServiceHandler();
    }

    const toggleServiceStatus = async (id, currentStatus) => {
        if (!id) return
        const action = currentStatus === true ? 'Suspend' : 'Enable'
        if (confirm(`${action} this service?`)) {
            try {
                await toggle_service(id, action === 'Enable')
                showToast(action === 'Enable' ? 'info' : 'success', action === 'Enable' ? 'Service Enabled' : 'Service Suspended')
                fetchServices()
            } catch (err) {
                showToast('danger', err.response?.data?.message || `Failed to ${action.toLowerCase()} service.`)
            }
        }
    }

    const filteredServices = useMemo(() => {
        const q = query.trim().toLowerCase()
        return services
            .filter((s) => {
                if (statusFilter === 'enabled') return s.status === true
                if (statusFilter === 'suspended') return s.status === false
                return true
            })
            .filter((s) => {
                if (!q) return true
                return String(s?.name || '').toLowerCase().includes(q)
            })
    }, [services, query, statusFilter])

    const rows = filteredServices.map((s, idx) => ({ ...s, _idx: idx + 1 }))

    const columns = [
        {
            key: '_idx',
            label: '#',
            render: (s) => s._idx,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            headerStyle: { width: 70 },
        },
        {
            key: 'name',
            label: 'Name',
            render: (s) => s?.name,
        },
        {
            key: 'image',
            label: 'Image',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (s) => (
                <img
                    className="rounded"
                    src={import.meta.env.VITE_API_URL + 'uploads/' + s.url}
                    alt=""
                    style={{ width: '3rem' }}
                />
            ),
        },
        {
            key: 'action',
            label: 'Action',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (s) => (
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <button onClick={() => editService(s)} className="btn btn-sm btn-outline-success">
                        Edit
                    </button>
                    <button
                        onClick={() => toggleServiceStatus(s.id, s.status)}
                        className={`btn btn-sm btn-outline-${s.status === true ? 'danger' : 'info'}`}
                    >
                        {s.status === true ? 'Suspend' : 'Enable'}
                    </button>
                </div>
            ),
        },
    ]

    const filtersContent = (
        <div className="d-grid gap-2">
            <div>
                <div className="small text-medium-emphasis mb-1">Search</div>
                <input
                    className="form-control form-control-sm"
                    placeholder="Search service name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div>
                <div className="small text-medium-emphasis mb-1">Status</div>
                <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="enabled">Enabled</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    setQuery('')
                    setStatusFilter('all')
                }}
                disabled={!query && statusFilter === 'all'}
            >
                Reset
            </button>
        </div>
    )

    const topContent = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4 className="fw-bold mb-0 text-uppercase">Manage Services</h4>
                </div>
            </div>

            {isService && (
                <div className="row g-2 mb-4 align-items-center">
                    <div className="col-md-5">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-control"
                            placeholder="Service name"
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="form-control"
                            accept="image/*"
                        />
                    </div>
                    {url && (
                        <div className="col-md-1">
                            <img
                                style={{ width: '50px', marginTop: '10px' }}
                                src={import.meta.env.VITE_API_URL + 'uploads/' + url}
                                alt="Service"
                            />
                        </div>
                    )}
                    <div className={`col-md-${url ? '2' : '3'} d-flex justify-content-end`}>
                        <button onClick={handleSubmit} className="btn btn-success me-2">
                            <CIcon icon={cilNoteAdd} className="me-1" />
                            {isEdit ? 'Update' : 'Save'}
                        </button>
                        <button onClick={toggleService} className="btn btn-outline-secondary">
                            <CIcon icon={cilX} className="me-1" />
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    )

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
            <ThemedTablePage
                actions={{
                    filtersContent,
                    onExport: null,
                    primary: !isService
                        ? {
                            label: 'Add Service',
                            color: 'success',
                            icon: <CIcon icon={cilPlus} />,
                            onClick: toggleService,
                        }
                        : null,
                }}
                topContent={topContent}
                columns={columns}
                rows={rows}
                rowKey={(s) => s.id}
                emptyText={services.length === 0 ? 'No Services Found' : 'No Services match your filters'}
                footerLeft={
                    <div className="small text-medium-emphasis">
                        Showing {rows.length} of {services.length} services
                    </div>
                }
            />
        </div>
    )
}

export default Services
