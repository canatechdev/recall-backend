import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilTrash, cilPencil, cilOptions } from '@coreui/icons'

// import { get_products, delete_product } from '../../../api/product_service'

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
        // Mock filter data
        setBrands([{ id: 1, name: 'Apple' }, { id: 2, name: 'Samsung' }])
        setCategories([{ id: 1, name: 'Phones' }, { id: 2, name: 'Laptops' }])
    }, [])

    const fetchProducts = async () => {
        try {
            // const res = await get_products()
            // setProducts(res.data)

            // Mock data
            setProducts([
                {
                    id: 1, name: 'iPhone 15 128GB', slug: 'iphone-15-128gb',
                    brand: 'Apple', category: 'Phones', model: 'iPhone 15',
                    vendor: 'Apple Inc.', status: 'active',
                    variants: [
                        { sku: 'APL-IP15-128-BLK', price: 79999, inventory_quantity: 50 },
                        { sku: 'APL-IP15-128-WHT', price: 79999, inventory_quantity: 30 },
                    ],
                    attributes: [{ key: 'RAM', value: '6GB' }, { key: 'Storage', value: '128GB' }]
                },
                {
                    id: 2, name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24',
                    brand: 'Samsung', category: 'Phones', model: 'Galaxy S24',
                    vendor: 'Samsung Electronics', status: 'active',
                    variants: [
                        { sku: 'SAM-S24-256-BLK', price: 74999, inventory_quantity: 25 },
                    ],
                    attributes: [{ key: 'RAM', value: '8GB' }, { key: 'Storage', value: '256GB' }]
                },
                {
                    id: 3, name: 'MacBook Pro 14" M3', slug: 'macbook-pro-14-m3',
                    brand: 'Apple', category: 'Laptops', model: 'MacBook Pro 14',
                    vendor: 'Apple Inc.', status: 'inactive',
                    variants: [
                        { sku: 'APL-MBP14-M3-8-512', price: 169900, inventory_quantity: 10 },
                    ],
                    attributes: [{ key: 'Chip', value: 'M3' }, { key: 'RAM', value: '8GB' }]
                }
            ])
        } catch (err) {
            console.log(err)
        }
    }

    const deleteProduct = async (id) => {
        if (!id) return
        if (confirm('Delete this product?')) {
            try {
                // await delete_product(id)
                setProducts(products.filter(p => p.id !== id))
            } catch (err) {
                console.log(err)
            }
        }
    }

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase())
        const matchBrand = !filterBrand || p.brand === brands.find(b => String(b.id) === filterBrand)?.name
        const matchCat = !filterCategory || p.category === categories.find(c => String(c.id) === filterCategory)?.name
        return matchSearch && matchBrand && matchCat
    })

    const totalStock = (variants) => variants.reduce((acc, v) => acc + v.inventory_quantity, 0)
    const minPrice = (variants) => Math.min(...variants.map(v => v.price))

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h4 className="fw-bold text-uppercase mb-0">Products</h4>
                    <button className="btn btn-primary" onClick={onAddClick}>
                        + Add Product
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
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                                {filtered.length ? filtered.map((p, idx) => (
                                    <React.Fragment key={p.id}>
                                        <tr>
                                            <td>{idx + 1}</td>
                                            <td className="text-start">
                                                <div className="fw-semibold">{p.name}</div>
                                                <small className="text-muted">{p.slug}</small>
                                            </td>
                                            <td>{p.brand}</td>
                                            <td>{p.category}</td>
                                            <td>{p.model}</td>
                                            <td>
                                                <span className="badge bg-secondary rounded-pill">
                                                    {p.variants.length}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${totalStock(p.variants) > 0 ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                                    {totalStock(p.variants)}
                                                </span>
                                            </td>
                                            <td>₹{minPrice(p.variants).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${p.status === 'active' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                    {p.status}
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
                                                <td colSpan="10" className="p-3">
                                                    <div className="row g-3">
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
                                                                    {p.variants.map((v, i) => (
                                                                        <tr key={i}>
                                                                            <td><code>{v.sku}</code></td>
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
                                                                    <tr><th>Key</th><th>Value</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {p.attributes.map((a, i) => (
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
                                )) : (
                                    <tr>
                                        <td colSpan="10" className="py-4 text-muted">No Products Found</td>
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