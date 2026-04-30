import React, { useEffect, useMemo, useState } from 'react'
import { CButton, CFormInput, CFormSelect } from '@coreui/react'
import { delete_category, get_categories, create_category, update_category, get_brands_all, get_category_brand_mappings, update_category_brand_mappings } from '../../../api/system_service'
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

    const [rowMenuId, setRowMenuId] = useState(null)

    const [mappingCategory, setMappingCategory] = useState(null)
    const [allBrands, setAllBrands] = useState([])
    const [mappedBrandIds, setMappedBrandIds] = useState(new Set())
    const [mappingLoading, setMappingLoading] = useState(false)
    const [mappingSaving, setMappingSaving] = useState(false)

    const [query, setQuery] = useState('')
    const toggleCategory = () => {
        setIsCategory(!isCategory);
        setIsEdit(false);
        setName('');
        setParent('');
        setFile('');
        setUrl('');
        setEditId(null);
        setMappingCategory(null);
    }

    const editCategory = ({ id, name, url, parent_id, status }) => {
        if (!id || !name || !url) { showToast('danger', 'Invalid Category'); return; }

        setIsCategory(true);
        setIsEdit(true);
        setEditId(id);
        setParent(parent_id || '');
        setName(name);
        setUrl(url);
        setMappingCategory(null);
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

    const deleteCategory = async (id) => {
        if (!id) return
        if (!confirm('Delete this category?')) return
        try {
            const res = await delete_category(id)
            const mode = res?.data?.mode
            if (mode === 'deactivated') {
                showToast('info', 'Category is in use, so it was deactivated.')
            } else {
                showToast('success', 'Category deleted')
            }
            fetchCategories()
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to delete category.')
        }
    }

    const openMapBrands = async (cat) => {
        if (!cat?.id) return showToast('danger', 'Invalid Category')
        setIsCategory(false)
        setIsEdit(false)
        setEditId(null)
        setMappingCategory({ id: cat.id, name: cat.name })
        setRowMenuId(null)

        try {
            setMappingLoading(true)
            const [brandsRes, mappingRes] = await Promise.all([
                allBrands.length ? Promise.resolve({ data: allBrands }) : get_brands_all().then((r) => ({ data: r.data })),
                get_category_brand_mappings(cat.id),
            ])

            const brands = Array.isArray(brandsRes.data) ? brandsRes.data : []
            if (!allBrands.length) setAllBrands(brands)

            const ids = mappingRes?.data?.data || []
            setMappedBrandIds(new Set((Array.isArray(ids) ? ids : []).map((n) => Number(n)).filter((n) => Number.isFinite(n))))
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to load brand mappings')
        } finally {
            setMappingLoading(false)
        }
    }

    const toggleMappedBrand = (brandId) => {
        const id = Number(brandId)
        if (!Number.isFinite(id)) return
        setMappedBrandIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const saveBrandMapping = async () => {
        if (!mappingCategory?.id) return
        try {
            setMappingSaving(true)
            const brandIds = Array.from(mappedBrandIds)
            await update_category_brand_mappings(mappingCategory.id, brandIds)
            showToast('success', 'Brand mapping saved')
            setMappingCategory(null)
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to save brand mapping')
        } finally {
            setMappingSaving(false)
        }
    }

    const filteredCategories = useMemo(() => {
        const q = query.trim().toLowerCase()
        return categories
            .filter((c) => {
                if (!q) return true
                return String(c.name || '').toLowerCase().includes(q)
            })
    }, [categories, query])

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
                <div className="d-flex justify-content-center">
                    <div className="position-relative">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setRowMenuId((p) => (p === r.id ? null : r.id))}
                            title="Actions"
                        >
                            ⋮
                        </button>

                        {rowMenuId === r.id && (
                            <div
                                className="dropdown-menu show"
                                style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20 }}
                            >
                                <button className="dropdown-item" onClick={() => { setRowMenuId(null); editCategory(r); }}>
                                    Edit
                                </button>
                                <button className="dropdown-item" onClick={() => { setRowMenuId(null); openMapBrands(r); }}>
                                    Map Brands
                                </button>
                                <div className="dropdown-divider" />
                                <button className="dropdown-item text-danger" onClick={() => { setRowMenuId(null); deleteCategory(r.id); }}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
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

            <div className="d-flex justify-content-end gap-2 pt-1">
                <CButton
                    size="sm"
                    color="light"
                    onClick={() => {
                        setQuery('')
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

    const mappingPanel = mappingCategory ? (
        <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-body d-flex justify-content-between align-items-center">
                <div>
                    <div className="fw-semibold">Map Brands</div>
                    <div className="small text-muted">Category: {mappingCategory.name}</div>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setMappingCategory(null)}
                        disabled={mappingSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={saveBrandMapping}
                        disabled={mappingSaving || mappingLoading}
                    >
                        {mappingSaving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
            <div className="card-body">
                {mappingLoading ? (
                    <div className="text-muted small">Loading brands…</div>
                ) : allBrands.length === 0 ? (
                    <div className="text-muted small">No brands found.</div>
                ) : (
                    <div className="row g-2" style={{ maxHeight: 320, overflow: 'auto' }}>
                        {allBrands.map((b) => (
                            <div key={b.id} className="col-12 col-md-6">
                                <label className="d-flex align-items-center gap-2 border rounded px-2 py-2">
                                    <input
                                        type="checkbox"
                                        checked={mappedBrandIds.has(Number(b.id))}
                                        onChange={() => toggleMappedBrand(b.id)}
                                    />
                                    <span className="small fw-semibold">{b.name}</span>
                                    <span className="ms-auto small text-muted">{b.slug}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    ) : null

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

            {mappingPanel}

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
