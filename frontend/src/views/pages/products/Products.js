import React, { useMemo, useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilTrash, cilPencil, cilOptions, cilImage, cilPlus } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { get_products, delete_product, get_brands, get_categories } from 'src/api/system_service'
import ThemedTablePage from 'src/components/ThemedTablePage'

const Products = ({ onAddClick }) => {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [filterBrand, setFilterBrand] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        fetchProducts()
        fetchBrands()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await get_products()
            setProducts(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const fetchBrands = async () => {
        try {
            const res = await get_brands()
            setBrands(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await get_categories('true')
            setCategories(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const deleteProduct = async (id) => {
        if (!id) return
        if (confirm('Delete this product?')) {
            try {
                await delete_product(id)
                setProducts(products.filter(p => p.id !== id))
            } catch (err) {
                console.log(err)
            }
        }
    }

    const getPrimaryImage = (images) => images?.find(img => img.is_primary) || images?.[0] || null

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.slug?.toLowerCase().includes(search.toLowerCase())
        const matchBrand = !filterBrand || p.brand === filterBrand
        const matchCat = !filterCategory || p.category === filterCategory
        return matchSearch && matchBrand && matchCat
    })

    const totalStock = (variants) => (variants || []).reduce((acc, v) => acc + Number(v.inventory_quantity), 0)
    const minPrice = (variants) => {
        if (!variants || variants.length === 0) return 0
        return Math.min(...variants.map(v => Number(v.price)))
    }

    const rows = useMemo(
        () => filtered.map((p, idx) => ({ ...p, _rowIndex: idx + 1 })),
        [filtered],
    )

    const columns = useMemo(
        () => [
            {
                key: '_rowIndex',
                label: '#',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                headerStyle: { width: 70 },
                render: (p) => p._rowIndex,
            },
            {
                key: 'image',
                label: 'Image',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                headerStyle: { width: 80 },
                render: (p) => {
                    const primaryImg = getPrimaryImage(p.images)
                    return primaryImg ? (
                        <img
                            src={import.meta.env.VITE_API_URL + 'uploads/' + primaryImg.url}
                            alt={primaryImg.alt_text || p.name}
                            style={{
                                width: 48,
                                height: 48,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #dee2e6',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                background: '#f8f9fa',
                                borderRadius: 6,
                                border: '1px solid #dee2e6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CIcon icon={cilImage} className="text-muted" style={{ width: 20, height: 20 }} />
                        </div>
                    )
                },
            },
            {
                key: 'product',
                label: 'Product',
                cellClassName: 'text-start',
                render: (p) => (
                    <div>
                        <div className="fw-semibold">{p.name}</div>
                        <small className="text-muted">{p.slug}</small>
                    </div>
                ),
            },
            { key: 'brand', label: 'Brand', render: (p) => p.brand },
            { key: 'category', label: 'Category', render: (p) => p.category },
            { key: 'model', label: 'Model', render: (p) => p.model },
            {
                key: 'variants',
                label: 'Variants',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                render: (p) => (
                    <span className="badge bg-secondary rounded-pill">{(p.variants || []).length}</span>
                ),
            },
            {
                key: 'stock',
                label: 'Stock',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                render: (p) => (
                    <span
                        className={`badge ${totalStock(p.variants) > 0 ? 'bg-success' : 'bg-danger'} rounded-pill`}
                    >
                        {totalStock(p.variants)}
                    </span>
                ),
            },
            {
                key: 'from',
                label: 'From',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                render: (p) => `₹${minPrice(p.variants).toLocaleString()}`,
            },
            {
                key: 'status',
                label: 'Status',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                render: (p) => (
                    <span
                        className={`badge ${p.status_label === 'active' || !p.status_label
                                ? 'bg-success'
                                : 'bg-warning text-dark'
                            }`}
                    >
                        {p.status_label || 'active'}
                    </span>
                ),
            },
            {
                key: 'action',
                label: 'Action',
                headerClassName: 'text-center',
                cellClassName: 'text-center',
                render: (p) => (
                    <>
                        <button
                            className="btn btn-sm btn-outline-info me-1"
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            title="View Details"
                        >
                            <CIcon icon={cilOptions} />
                        </button>
                        <button className="btn btn-sm btn-outline-success me-1" title="Edit">
                            <CIcon icon={cilPencil} />
                        </button>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteProduct(p.id)}
                            title="Delete"
                        >
                            <CIcon icon={cilTrash} />
                        </button>
                    </>
                ),
            },
        ],
        [deleteProduct, expandedId],
    )

    const filtersContent = (
        <div className="d-grid gap-2">
            <div>
                <div className="small text-medium-emphasis mb-1">Search</div>
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                        <CIcon icon={cilSearch} />
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or slug..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <div className="small text-medium-emphasis mb-1">Brand</div>
                <select className="form-select form-select-sm" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                            {b.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <div className="small text-medium-emphasis mb-1">Category</div>
                <select className="form-select form-select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    setSearch('')
                    setFilterBrand('')
                    setFilterCategory('')
                }}
                disabled={!search && !filterBrand && !filterCategory}
            >
                Reset
            </button>
        </div>
    )

    const handleAdd = () => {
        onAddClick?.()
        navigate('/products/add')
    }

    const topContent = (
        <div className="mb-3">
            <h4 className="fw-bold text-uppercase mb-0">Products</h4>
        </div>
    )

    return (
        <div className="container py-4">
            <ThemedTablePage
                actions={{
                    filtersContent,
                    onExport: null,
                    primary: {
                        label: 'Add Product',
                        color: 'primary',
                        icon: <CIcon icon={cilPlus} />,
                        onClick: handleAdd,
                    },
                }}
                topContent={topContent}
                columns={columns}
                rows={rows}
                rowKey={(p) => p.id}
                rowExpansion={{
                    isExpanded: (p) => expandedId === p.id,
                    rowClassName: 'table-secondary',
                    cellClassName: 'p-0',
                    render: (p) => (
                        <div className="p-3">
                            <div className="row g-3">
                                {(p.images || []).length > 0 && (
                                    <div className="col-12">
                                        <p className="fw-semibold mb-2 text-start">
                                            Images
                                            <span className="badge bg-secondary ms-2">{p.images.length}</span>
                                        </p>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {p.images
                                                .slice()
                                                .sort((a, b) => a.sort_index - b.sort_index)
                                                .map((img) => (
                                                    <div key={img.id} className="position-relative">
                                                        <img
                                                            src={img.url}
                                                            alt={img.alt_text || ''}
                                                            style={{
                                                                width: 72,
                                                                height: 72,
                                                                objectFit: 'cover',
                                                                borderRadius: 6,
                                                                border: img.is_primary
                                                                    ? '2px solid #ffc107'
                                                                    : '1px solid #dee2e6',
                                                            }}
                                                            title={img.alt_text || `Image #${img.sort_index}`}
                                                        />
                                                        {img.is_primary && (
                                                            <span
                                                                className="badge bg-warning text-dark position-absolute"
                                                                style={{
                                                                    fontSize: '0.6rem',
                                                                    bottom: 2,
                                                                    left: 2,
                                                                    padding: '1px 4px',
                                                                }}
                                                            >
                                                                ★
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                <div className="col-md-7">
                                    <p className="fw-semibold mb-2 text-start">Variants</p>
                                    <table className="table table-sm table-bordered mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>SKU</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(p.variants || []).map((v, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <code>{v.sku}</code>
                                                    </td>
                                                    <td>₹{v.price.toLocaleString()}</td>
                                                    <td>{v.inventory_quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-md-5">
                                    <p className="fw-semibold mb-2 text-start">Attributes</p>
                                    <table className="table table-sm table-bordered mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Key</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(p.attributes || []).map((a, i) => (
                                                <tr key={i}>
                                                    <td className="text-muted">{a.key}</td>
                                                    <td>{a.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ),
                }}
                emptyText={products.length === 0 ? 'No Products Found' : 'No Products match your filters'}
                footerLeft={
                    <div className="small text-medium-emphasis">
                        Showing {filtered.length} of {products.length} products
                    </div>
                }
            />
        </div>
    )
}

export default Products
