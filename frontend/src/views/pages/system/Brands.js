import React, { useEffect, useMemo, useState } from 'react'
import {
    get_cat_brands,
    create_brand,
    delete_brand,
    get_categories,
    update_brand,
    download_brands_template,
    import_brands_excel,
} from "src/api/system_service"
import CIcon from '@coreui/icons-react'
import { cilNoteAdd, cilPlus, cilX } from '@coreui/icons'
import ThemedTablePage from 'src/components/ThemedTablePage'

const Brands = () => {
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [isBrand, setIsBrand] = useState(false)
    const [toast, setToast] = useState(null)

    const [name, setName] = useState("")
    const [category, setCategory] = useState("") // category slug
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState('')
    const [isEdit, setIsEdit] = useState(false)
    const [editId, setEditId] = useState(null)

    const [query, setQuery] = useState('')

    const [importFile, setImportFile] = useState(null)
    const [importLoading, setImportLoading] = useState(false)

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3500)
    }

    const toggleBrand = () => {
        setIsBrand(!isBrand)
        setIsEdit(false)
        setEditId(null)
        setName('')
        setFile(null)
        setUrl('')
    }

    const editBrand = ({ id, name, url }) => {
        if (!id || !name || !url) return showToast('danger', 'Invalid Brand')
        setIsBrand(true)
        setIsEdit(true)
        setEditId(id)
        setName(name)
        setUrl(url)
        setFile(null)
    }

    const fetchBrands = async (catId) => {
        try {
            const response = await get_cat_brands(catId)
            if (response.status === 200) setBrands(response.data)
        } catch (err) {
            console.log(err)
        }
    }
    const fetchCategories = async () => {
        try {
            const response = await get_categories(true)
            if (response.status === 200) {
                setCategories(response.data);
                const firstSlug = response.data[0]?.slug || ''
                setCategory(firstSlug)
                if (firstSlug) fetchBrands(firstSlug)
                else setBrands([])
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [])

    const downloadTemplate = async () => {
        try {
            const res = await download_brands_template()
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'brands_import_template.xlsx'
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to download template.')
        }
    }

    const importExcelHandler = async () => {
        if (!importFile) return showToast('danger', 'Please choose an Excel file to import.')
        if (!confirm('Import brands from this Excel file?')) return

        try {
            setImportLoading(true)
            const formData = new FormData()
            formData.append('file', importFile)
            const res = await import_brands_excel(formData)

            const { inserted = 0, linked = 0, skipped = 0, errors = [] } = res?.data || {}
            const errCount = Array.isArray(errors) ? errors.length : 0
            showToast('success', `Imported: ${inserted}, Linked: ${linked}, Skipped: ${skipped}, Errors: ${errCount}`)
            if (errCount) console.error('Brand import errors:', errors)

            setImportFile(null)
            fetchBrands(category)
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to import brands.')
        } finally {
            setImportLoading(false)
        }
    }

    const createBrandHandler = async () => {
        if (!name || !category || !file) return showToast("danger", "Brand Name, Category & Image are required")
        if (confirm(`Is spelled "${name}" correct?`)) {
            const catObj = categories.find((c) => c.slug === category)
            if (!catObj) return showToast("danger", "Invalid category selected")
            try {
                const formData = new FormData()
                formData.append("name", name)
                formData.append("category_id", catObj.id)
                formData.append("image", file)
                await create_brand(formData)
                showToast("success", "Brand created successfully!")
                fetchBrands(category)
                toggleBrand()
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to create brand.")
            }
        }
    }

    const updateBrandHandler = async () => {
        if (!editId) return showToast("danger", "Invalid Brand")
        if (!name) return showToast("danger", "Brand name is required")
        if (confirm(`Update to "${name}"?`)) {
            try {
                const formData = new FormData()
                formData.append("name", name)
                if (file) formData.append("image", file)
                await update_brand(editId, formData)
                showToast("success", "Brand updated successfully!")
                fetchBrands(category)
                toggleBrand()
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to update brand.")
            }
        }
    }

    const handleSubmit = () => {
        if (isEdit) updateBrandHandler();
        else createBrandHandler();
    }

    const deleteBrand = async (id) => {
        if (!id) return
        if (!confirm('Delete this brand?')) return
        try {
            await delete_brand(id)
            showToast('success', 'Brand deleted')
            fetchBrands(category)
        } catch (err) {
            showToast('danger', err.response?.data?.message || 'Failed to delete brand.')
        }
    }
    const setBrandsByCategory = (catSlug) => {
        fetchBrands(catSlug);
        setCategory(catSlug)
    }

    const filteredBrands = useMemo(() => {
        const q = query.trim().toLowerCase()
        return brands
            .filter((b) => {
                if (!q) return true
                return String(b?.name || '').toLowerCase().includes(q)
            })
    }, [brands, query])

    const rows = filteredBrands.map((b, idx) => ({ ...b, _idx: idx + 1 }))

    const columns = [
        {
            key: '_idx',
            label: '#',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            headerStyle: { width: 70 },
            render: (b) => b._idx,
        },
        { key: 'name', label: 'Name', render: (b) => b?.name },
        {
            key: 'image',
            label: 'Image',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (b) => (
                <img
                    className="rounded"
                    src={import.meta.env.VITE_API_URL + 'uploads/' + b.url}
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
            render: (b) => (
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <button onClick={() => editBrand(b)} className="btn btn-sm btn-outline-success">
                        Edit
                    </button>
                    <button onClick={() => deleteBrand(b.id)} className="btn btn-sm btn-outline-danger">
                        Delete
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
                    placeholder="Search brand name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    setQuery('')
                }}
                disabled={!query}
            >
                Reset
            </button>
        </div>
    )

    const topContent = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold mb-0 text-uppercase d-flex flex-wrap">
                    <span className="my-auto">Manage Brands :</span>
                    <select
                        style={{ outline: 'none' }}
                        className="no-arrow border-0 d-inline-block w-auto ms-2 text-uppercase h6 my-auto"
                        value={category}
                        onChange={(e) => setBrandsByCategory(e.target.value)}
                    >
                        {categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </h4>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={downloadTemplate}>
                        Download Template
                    </button>

                    <input
                        type="file"
                        className="form-control form-control-sm"
                        style={{ maxWidth: 240 }}
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={importExcelHandler}
                        disabled={!importFile || importLoading}
                    >
                        {importLoading ? 'Importing...' : 'Import Excel'}
                    </button>
                </div>
            </div>

            {isBrand && (
                <div className="row g-2 mb-4 align-items-center">
                    <div className="col-md-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-control"
                            placeholder="Brand name"
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="form-control"
                        />
                    </div>

                    {url && (
                        <div className="col-md-2">
                            <img
                                style={{ width: '50px', marginTop: '10px' }}
                                src={import.meta.env.VITE_API_URL + 'uploads/' + url}
                                alt="Brand"
                            />
                        </div>
                    )}

                    <div className={`col-md-${url ? '3' : '5'} d-flex justify-content-end gap-2`}>
                        <button onClick={handleSubmit} className="btn btn-success me-2">
                            <CIcon icon={cilNoteAdd} className="me-1" />
                            {isEdit ? 'Update' : 'Save'}
                        </button>
                        <button onClick={toggleBrand} className="btn btn-outline-secondary">
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
                    primary: !isBrand
                        ? {
                            label: 'Add Brand',
                            color: 'success',
                            icon: <CIcon icon={cilPlus} />,
                            onClick: toggleBrand,
                        }
                        : null,
                }}
                topContent={topContent}
                columns={columns}
                rows={rows}
                rowKey={(b) => b.id}
                emptyText={brands.length === 0 ? 'No Brands Found' : 'No Brands match your filters'}
                footerLeft={
                    <div className="small text-medium-emphasis">
                        Showing {rows.length} of {brands.length} brands
                    </div>
                }
            />
        </div>
    )
}

export default Brands