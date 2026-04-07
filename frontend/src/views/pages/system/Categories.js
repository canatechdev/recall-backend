import React, { useEffect, useMemo, useState } from 'react'
import { CButton, CFormInput, CFormSelect } from '@coreui/react'
import { get_categories, toggle_category, create_category, update_category } from '../../../api/system_service'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilNoteAdd, cilX } from '@coreui/icons'
import ThemedTablePage from 'src/components/ThemedTablePage'

const Categories = () => {
    const [categories, setCategories] = useState([])
    const [isCategory, setIsCategory] = useState(false)
    const [name, setName] = useState("")
    const [parent, setParent] = useState("")
    const [file, setFile] = useState("")
    const [toast, setToast] = useState(null)
    const [isEdit, setIsEdit] = useState(false)
    const [editId, setEditId] = useState(null)
    const [url, setUrl] = useState('')

    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // all | enabled | suspended
    const toggleCategory = () => {
        setIsCategory(!isCategory);
        setIsEdit(false);
        setName('');
        setParent('');
        setFile('');
        setUrl('');
        setEditId(null);
    }

    const editCategory = ({ id, name, url, parent_id, status }) => {
        if (!id || !name || !url) { showToast('danger', 'Invalid Category'); return; }

        setIsCategory(true);
        setIsEdit(true);
        setEditId(id);
        setParent(parent_id || '');
        setName(name);
        setUrl(url);
    }
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchCategories = async () => {
        try {
            const response = await get_categories(false)
            if (response.status === 200) {
                setCategories(response.data)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleSubmit = () => {
        if (isEdit) {
            updateCategoryHandler();
        } else {
            createCategoryHandler();
        }
    }

    const createCategoryHandler = async () => {
        if (!name || !file) return showToast("danger", "Category name & Image are required")

        if (confirm(`Is "${name}" correct?`)) {
            try {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("parent_id", parent || "");
                formData.append("image", file);
                await create_category(formData);
                showToast("success", "Category created successfully!");
                fetchCategories();
                toggleCategory();
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to create category.");
            }
        }
    }

    const updateCategoryHandler = async () => {
        if (!name) return showToast("danger", "Category name is required");

        if (confirm(`Update to "${name}"?`)) {
            try {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("parent_id", parent || "");
                if (file) {
                    formData.append("image", file);
                }
                await update_category(editId, formData);
                showToast("success", "Category updated successfully!");
                fetchCategories();
                toggleCategory();
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to update category.");
            }
        }
    };


    const toggleCategoryStatus = async (id, currentStatus) => {
        if (!id) return;
        const action = currentStatus === true ? 'Suspend' : 'Enable';
        if (confirm(`${action} this category?`)) {
            try {
                if (action === 'Suspend') {
                    await toggle_category(id, false);
                    showToast("success", "Category Suspended");
                } else {
                    await toggle_category(id, true);
                    showToast("info", "Enable functionality to be implemented.");
                }
                fetchCategories();
            } catch (err) {
                showToast("danger", err.response?.data?.message || `Failed to ${action.toLowerCase()} category.`);
            }
        }
    }

    const filteredCategories = useMemo(() => {
        const q = query.trim().toLowerCase()
        return categories
            .filter((c) => {
                if (statusFilter === 'enabled') return c.status === true
                if (statusFilter === 'suspended') return c.status === false
                return true
            })
            .filter((c) => {
                if (!q) return true
                return String(c.name || '').toLowerCase().includes(q)
            })
    }, [categories, query, statusFilter])

    const rows = filteredCategories.map((c, idx) => ({ ...c, _idx: idx + 1 }))

    const columns = [
        { key: '_idx', label: '#', headerClassName: 'text-center', cellClassName: 'text-center', render: (r) => r._idx },
        { key: 'name', label: 'Name', render: (r) => r.name },
        { key: 'parent', label: 'Parent', render: (r) => r.parent || '-' },
        {
            key: 'image',
            label: 'Image',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (r) => (
                <img
                    className="rounded"
                    src={import.meta.env.VITE_API_URL + 'uploads/' + r.url}
                    alt=""
                    style={{ width: '3rem' }}
                />
            )
        },
        {
            key: 'action',
            label: 'Action',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (r) => (
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <button onClick={() => editCategory(r)} className="btn btn-sm btn-outline-success">
                        Edit
                    </button>
                    <button
                        onClick={() => toggleCategoryStatus(r.id, r.status)}
                        className={`btn btn-sm btn-outline-${r.status === true ? 'danger' : 'info'}`}
                    >
                        {r.status === true ? 'Suspend' : 'Enable'}
                    </button>
                </div>
            ),
        },
    ]

    const filtersContent = (
        <div className="d-grid gap-2">
            <div>
                <div className="small text-medium-emphasis mb-1">Search</div>
                <CFormInput
                    size="sm"
                    placeholder="Search category name"
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
                    <option value="enabled">Enabled</option>
                    <option value="suspended">Suspended</option>
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

    const topContent = isCategory ? (
        <div className="row g-2 mb-4 align-items-center">
            <div className="col-md-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    placeholder="Category name"
                />
            </div>
            <div className="col-md-3">
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="form-control"
                />
            </div>
            {url && (
                <div className="col-md-2">
                    <img
                        style={{ width: '50px', marginTop: '10px' }}
                        src={import.meta.env.VITE_API_URL + 'uploads/' + url}
                        alt="Category"
                    />
                </div>
            )}

            {isEdit === false && (
                <div className="col-md-3">
                    <select
                        value={parent}
                        onChange={(e) => setParent(e.target.value)}
                        className="form-select"
                    >
                        <option value="">No Parent</option>
                        {categories
                            .filter((c) => c.id !== editId)
                            .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                    </select>
                </div>
            )}

            <div className={`col-md-${isEdit ? '3' : '2'} d-flex justify-content-end`}>
                <button onClick={handleSubmit} className="btn btn-success me-2">
                    <CIcon icon={cilNoteAdd} className="me-1" />
                    {isEdit ? 'Update' : 'Save'}
                </button>
                <button onClick={toggleCategory} className="btn btn-outline-secondary">
                    <CIcon icon={cilX} className="me-1" />
                    Cancel
                </button>
            </div>
        </div>
    ) : null

    const footerLeft = (
        <div className="small text-medium-emphasis">
            Showing 1-{rows.length} of {rows.length} categories
        </div>
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
                    primary: !isCategory
                        ? {
                            label: 'Add Category',
                            color: 'success',
                            onClick: toggleCategory,
                            icon: <CIcon icon={cilPlus} />,
                        }
                        : undefined,
                }}
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                loading={false}
                emptyText="No Categories Found"
                topContent={topContent}
                footerLeft={footerLeft}
            />
        </div>
    )
}

export default Categories
