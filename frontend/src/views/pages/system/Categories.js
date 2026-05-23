import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CButton, CFormInput, CFormSelect } from '@coreui/react'
import { delete_category, get_categories, create_category, update_category, get_brands_all, get_category_brand_mappings, update_category_brand_mappings } from '../../../api/system_service'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilNoteAdd, cilX } from '@coreui/icons'
import ThemedTablePage from 'src/components/ThemedTablePage'

const Categories = () => {
    const [categories, setCategories] = useState([])
    const [isCategory, setIsCategory] = useState(false)
    const [loading, setLoading] = useState(false)
    const [attempted, setAttempted] = useState(false)
    const [name, setName] = useState("")
    const [parent, setParent] = useState("")
    const [file, setFile] = useState(null)
    const [toast, setToast] = useState(null)
    const [isEdit, setIsEdit] = useState(false)
    const [editId, setEditId] = useState(null)
    const [url, setUrl] = useState('')

    const [rowMenu, setRowMenu] = useState(null) // { id, rect }
    const [rowMenuPos, setRowMenuPos] = useState({ top: 0, left: 0 })
    const rowMenuRef = useRef(null)

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
        setFile(null);
        setUrl('');
        setEditId(null);
        setMappingCategory(null);
        setAttempted(false);
        setRowMenu(null);
    }

    const editCategory = ({ id, name, url, parent_id, status }) => {
        if (!id || !name || !url) { showToast('danger', 'Invalid Category'); return; }

        setIsCategory(true);
        setIsEdit(true);
        setEditId(id);
        setParent(parent_id || '');
        setName(name);
        setUrl(url);
        setFile(null);
        setMappingCategory(null);
        setAttempted(false);
    }
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await get_categories(false)
            if (response.status === 200) {
                setCategories(response.data)
            }
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleSubmit = () => {
        setAttempted(true)
        const nameError = !(name || '').trim() ? 'Category name is required.' : ''
        const imageError = !isEdit && !file ? 'Image is required.' : ''
        if (nameError || imageError) {
            showToast('danger', 'Please fill the required fields.')
            return
        }
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
        if (!window.confirm('Are you sure want to delete this?')) return
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
        setRowMenu(null)

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

    const rowMenuRow = useMemo(() => {
        if (!rowMenu?.id) return null
        return rows.find((r) => String(r.id) === String(rowMenu.id)) || null
    }, [rowMenu, rows])

    const openRowMenu = (r, e) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        setRowMenu((prev) => (prev?.id === r.id ? null : { id: r.id, rect }))
    }

    useEffect(() => {
        if (!rowMenu) return

        const handleDocMouseDown = (e) => {
            const menuEl = rowMenuRef.current
            if (menuEl && menuEl.contains(e.target)) return
            if (e.target?.closest?.('[data-row-menu-btn]')) return
            setRowMenu(null)
        }

        const closeOnScrollOrResize = () => {
            setRowMenu(null)
        }

        document.addEventListener('mousedown', handleDocMouseDown)
        window.addEventListener('scroll', closeOnScrollOrResize, true)
        window.addEventListener('resize', closeOnScrollOrResize)

        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown)
            window.removeEventListener('scroll', closeOnScrollOrResize, true)
            window.removeEventListener('resize', closeOnScrollOrResize)
        }
    }, [rowMenu])

    useEffect(() => {
        if (!rowMenu?.rect) return

        const rect = rowMenu.rect
        const padding = 8

        const place = () => {
            const menuEl = rowMenuRef.current
            const menuHeight = menuEl?.offsetHeight || 140
            const menuWidth = menuEl?.offsetWidth || 180

            let top = rect.bottom + 6
            if (top + menuHeight + padding > window.innerHeight) {
                top = Math.max(padding, rect.top - menuHeight - 6)
            }

            let left = rect.right - menuWidth
            if (left < padding) left = padding
            if (left + menuWidth + padding > window.innerWidth) {
                left = Math.max(padding, window.innerWidth - menuWidth - padding)
            }

            setRowMenuPos({ top, left })
        }

        // Run once immediately, then once after render to get real menu size.
        place()
        const raf = window.requestAnimationFrame(place)
        return () => window.cancelAnimationFrame(raf)
    }, [rowMenu])

    const columns = [
        { key: '_idx', label: 'SR.NO', headerClassName: 'text-center', cellClassName: 'text-center', render: (r) => r._idx },
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
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        data-row-menu-btn
                        onClick={(e) => openRowMenu(r, e)}
                        title="Actions"
                    >
                        ⋮
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

    const topContent = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0 text-uppercase">Manage Categories</h4>
            </div>

            {isCategory ? (
                <div className="row g-2 mb-4 align-items-center">
                    <div className="col-md-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`form-control ${attempted && !(name || '').trim() ? 'is-invalid' : ''}`}
                            placeholder="Category name"
                        />
                        {attempted && !(name || '').trim() ? (
                            <div className="invalid-feedback d-block">Category name is required.</div>
                        ) : null}
                    </div>
                    <div className="col-md-3">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className={`form-control ${attempted && !isEdit && !file ? 'is-invalid' : ''}`}
                            accept="image/*"
                        />
                        {attempted && !isEdit && !file ? (
                            <div className="invalid-feedback d-block">Image is required.</div>
                        ) : null}
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
            ) : null}
        </>
    )

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
                loading={loading}
                emptyText="No Categories Found"
                topContent={topContent}
                footerLeft={footerLeft}
            />

            {rowMenu && rowMenuRow ? (
                <div
                    ref={rowMenuRef}
                    className="dropdown-menu show"
                    style={{
                        position: 'fixed',
                        top: rowMenuPos.top,
                        left: rowMenuPos.left,
                        zIndex: 3000,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="dropdown-item" onClick={() => { setRowMenu(null); editCategory(rowMenuRow); }}>
                        Edit
                    </button>
                    <button className="dropdown-item" onClick={() => { setRowMenu(null); openMapBrands(rowMenuRow); }}>
                        Map Brands
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item text-danger" onClick={() => { setRowMenu(null); deleteCategory(rowMenuRow.id); }}>
                        Delete
                    </button>
                </div>
            ) : null}
        </div>
    )
}

export default Categories
