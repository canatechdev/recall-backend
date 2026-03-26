import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilTrash, cilPencil, cilOptions, cilImage, cilPlus } from '@coreui/icons'
import { Link } from 'react-router-dom'
import { get_products, delete_product, get_brands, get_categories } from 'src/api/system_service'

const Products = ({ onAddClick }) => {
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

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h4 className="fw-bold text-uppercase mb-0">Products</h4>
                    <button className="btn btn-primary" onClick={onAddClick}>
                        <Link to="/products/add" className="text-white text-decoration-none">
                            <CIcon icon={cilPlus} className="me-1" />
                            Add Product
                        </Link>
                    </button>
                </div>

                <div className="card-body">

                    {/* Filters */}
                    <div className="row g-2 mb-4">
                        <div className="col-md-5">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <CIcon icon={cilSearch} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or slug..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                                <option value="">All Brands</option>
                                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-1">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => { setSearch(''); setFilterBrand(''); setFilterCategory('') }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light text-center">
                                <tr>
                                    <th>#</th>
                                    <th style={{ width: '60px' }}>Image</th>
                                    <th className="text-start">Product</th>
                                    <th>Brand</th>
                                    <th>Category</th>
                                    <th>Model</th>
                                    <th>Variants</th>
                                    <th>Stock</th>
                                    <th>From</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-center">
                                {filtered.length ? filtered.map((p, idx) => {
                                    const primaryImg = getPrimaryImage(p.images)
                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    {primaryImg ? (
                                                        <img
                                                            src={import.meta.env.VITE_API_URL+'uploads/' + primaryImg.url}
                                                            alt={primaryImg.alt_text || p.name}
                                                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #dee2e6' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{ width: 48, height: 48, background: '#f8f9fa', borderRadius: 6, border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <CIcon icon={cilImage} className="text-muted" style={{ width: 20, height: 20 }} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-start">
                                                    <div className="fw-semibold">{p.name}</div>
                                                    <small className="text-muted">{p.slug}</small>
                                                </td>
                                                <td>{p.brand}</td>
                                                <td>{p.category}</td>
                                                <td>{p.model}</td>
                                                <td>
                                                    <span className="badge bg-secondary rounded-pill">{(p.variants || []).length}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${totalStock(p.variants) > 0 ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                                        {totalStock(p.variants)}
                                                    </span>
                                                </td>
                                                <td>₹{minPrice(p.variants).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${p.status_label === 'active' || !p.status_label ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                        {p.status_label || 'active'}
                                                    </span>
                                                </td>
                                                <td>
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
                                                </td>
                                            </tr>

                                            {/* Expanded Row */}
                                            {expandedId === p.id && (
                                                <tr className="table-secondary">
                                                    <td colSpan="11" className="p-3">
                                                        <div className="row g-3">

                                                            {/* Images strip */}
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
                                                                            .map(img => (
                                                                                <div key={img.id} className="position-relative">
                                                                                    <img
                                                                                        src={img.url}
                                                                                        alt={img.alt_text || ''}
                                                                                        style={{
                                                                                            width: 72, height: 72,
                                                                                            objectFit: 'cover',
                                                                                            borderRadius: 6,
                                                                                            border: img.is_primary ? '2px solid #ffc107' : '1px solid #dee2e6'
                                                                                        }}
                                                                                        title={img.alt_text || `Image #${img.sort_index}`}
                                                                                    />
                                                                                    {img.is_primary && (
                                                                                        <span
                                                                                            className="badge bg-warning text-dark position-absolute"
                                                                                            style={{ fontSize: '0.6rem', bottom: 2, left: 2, padding: '1px 4px' }}
                                                                                        >
                                                                                            ★
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Variants */}
                                                            <div className="col-md-7">
                                                                <p className="fw-semibold mb-2 text-start">Variants</p>
                                                                <table className="table table-sm table-bordered mb-0">
                                                                    <thead className="table-light">
                                                                        <tr><th>SKU</th><th>Price</th><th>Stock</th></tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(p.variants || []).map((v, i) => (
                                                                            <tr key={i}>
                                                                                <td><code>{v.sku}</code></td>
                                                                                <td>₹{v.price.toLocaleString()}</td>
                                                                                <td>{v.inventory_quantity}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            {/* Attributes */}
                                                            <div className="col-md-5">
                                                                <p className="fw-semibold mb-2 text-start">Attributes</p>
                                                                <table className="table table-sm table-bordered mb-0">
                                                                    <thead className="table-light">
                                                                        <tr><th>Key</th><th>Value</th></tr>
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
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan="11" className="py-4 text-muted">No Products Found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="text-muted small mt-2">
                        Showing {filtered.length} of {products.length} products
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Products
