import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilX, cilTrash, cilNoteAdd } from '@coreui/icons'
import { get_cat_brands, get_categories, get_brand_series } from "src/api/system_service"
import { get_models } from '../../../api/system_service'

// Mock API functions - replace with your actual imports
// import {
//    get_categories, get_models, get_brand_series,
//   create_product_master, create_product_option, create_product_option_value,
//   create_product_variant, create_product_attribute
// } from '../../../api/product_service'

const AddProduct = ({ onSuccess }) => {
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [modelSeries, setModelSeries] = useState([])
    const [models, setModels] = useState([])

    const [step, setStep] = useState(1)

    // Step 1 - Product Master
    const [productName, setProductName] = useState('')
    const [brandId, setBrandId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [seriesId, setSeriesId] = useState('')
    const [modelId, setModelId] = useState('')
    const [description, setDescription] = useState('')
    const [vendor, setVendor] = useState('')
    const [slug, setSlug] = useState('')

    // Step 2 - Options & Variants
    const [options, setOptions] = useState([
        { name: '', values: [''] }
    ])

    // Step 3 - Variants
    const [variants, setVariants] = useState([
        { sku: '', price: '', inventory_quantity: 0 }
    ])

    // Step 4 - Attributes
    const [attributes, setAttributes] = useState([
        { key: '', value: '' }
    ])

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchInitial();
    }, [])

    useEffect(() => {
        if (brandId) fetchSeries(brandId)
        setSeriesId('')
        setModelId('')
        setModels([])
    }, [brandId])

    useEffect(() => {
        if (seriesId) fetchModels(seriesId)
        setModelId('')
    }, [seriesId])

    useEffect(() => {
        if (productName) {
            setSlug(productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        }
    }, [productName])

    const fetchInitial = async () => {
        try {

            const cats = await get_categories(true);
            setCategories(cats.data);
            // setCategories([{ id: 1, name: 'Phones' }, { id: 2, name: 'Laptops' }])
        } catch (err) {
            console.log(err)
        }
    }
    const fetchBrands = async (catId) => {
        const brands = await get_cat_brands(catId);
        setBrands(brands.data);
    }

    const fetchSeries = async (bSlug) => {
        try {
            const res = await get_brand_series(bSlug)
            setModelSeries(res.data)
            // setModelSeries([{ id: 1, name: 'iPhone' }, { id: 2, name: 'Galaxy S' }])
        } catch (err) { console.log(err) }
    }

    const fetchModels = async (seriesId) => {
        try {
            setSeriesId(seriesId);
            if (!categoryId || !brandId || !seriesId) return;
            const res = await get_models(categoryId, brandId, seriesId);
            setModels(res.data);
            // setModels([{ id: 1, name: 'iPhone 15' }, { id: 2, name: 'iPhone 15 Pro' }])
        } catch (err) { console.log(err) }
    }

    // Options handlers
    const addOption = () => setOptions([...options, { name: '', values: [''] }])
    const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i))
    const updateOptionName = (i, val) => {
        const updated = [...options]
        updated[i].name = val
        setOptions(updated)
    }
    const addOptionValue = (optIdx) => {
        const updated = [...options]
        updated[optIdx].values.push('')
        setOptions(updated)
    }
    const removeOptionValue = (optIdx, valIdx) => {
        const updated = [...options]
        updated[optIdx].values = updated[optIdx].values.filter((_, i) => i !== valIdx)
        setOptions(updated)
    }
    const updateOptionValue = (optIdx, valIdx, val) => {
        const updated = [...options]
        updated[optIdx].values[valIdx] = val
        setOptions(updated)
    }

    // Variants handlers
    const addVariant = () => setVariants([...variants, { sku: '', price: '', inventory_quantity: 0 }])
    const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i))
    const updateVariant = (i, field, val) => {
        const updated = [...variants]
        updated[i][field] = val
        setVariants(updated)
    }

    // Attributes handlers
    const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }])
    const removeAttribute = (i) => setAttributes(attributes.filter((_, idx) => idx !== i))
    const updateAttribute = (i, field, val) => {
        const updated = [...attributes]
        updated[i][field] = val
        setAttributes(updated)
    }
    const setBrandLoadSeries = async (bid) => {
        // const result = await get__series(bid);
        await fetchSeries(bid);
        // console.log(result.data);
        // setModelSeries(result.data);
        setBrandId(bid)
    }
    const brandsFromCat = async (catId) => {
        console.log(catId)
        setCategoryId(catId);
        await fetchBrands(catId);
    }
    // const loadModelFromSeries = async (seriesId) => {
    //     setSeriesId(seriesId);
    //     await fetchModels(seriesId);
    // }
    const handleSubmit = async () => {
        if (!productName || !brandId || !categoryId || !modelId) {
            return alert("Please fill all required fields in Step 1")
        }
        if (confirm(`Save product "${productName}"?`)) {
            setLoading(true)
            try {
                // Step 1: Create product master
                // const prodRes = await create_product_master({ name: productName, brand_id: brandId, category_id: categoryId, model_id: modelId, description, vendor, slug })
                // const productId = prodRes.data.id

                // Step 2: Create options + values
                // for (const opt of options) {
                //     if (!opt.name) continue
                //     const optRes = await create_product_option({ product_id: productId, name: opt.name })
                //     for (const v of opt.values) {
                //         if (v) await create_product_option_value({ option_id: optRes.data.id, value: v })
                //     }
                // }

                // Step 3: Create variants
                // for (const v of variants) {
                //     if (!v.sku || !v.price) continue
                //     await create_product_variant({ product_id: productId, ...v })
                // }

                // Step 4: Create attributes
                // for (const a of attributes) {
                //     if (!a.key) continue
                //     await create_product_attribute({ product_id: productId, ...a })
                // }

                alert("Product created successfully!")
                if (onSuccess) onSuccess()
            } catch (err) {
                console.log(err)
                alert("Something went wrong.")
            } finally {
                setLoading(false)
            }
        }
    }

    const steps = ['Basic Info', 'Options', 'Variants', 'Attributes']

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold text-uppercase mb-0">Add Product</h4>
                    <div className="d-flex gap-2">
                        {steps.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i + 1)}
                                className={`btn btn-sm ${step === i + 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
                            >
                                {i + 1}. {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-body">

                    {/* STEP 1 - Basic Info */}
                    {step === 1 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Basic Information</h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Product Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. iPhone 15 128GB Black"
                                        value={productName}
                                        onChange={e => setProductName(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Slug</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="form-control"
                                        value={slug}
                                        onChange={e => setSlug(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                                    <select className="form-select" value={categoryId} onChange={e => brandsFromCat(e.target.value)}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Brand <span className="text-danger">*</span></label>
                                    <select className="form-select" value={brandId} onChange={e => setBrandLoadSeries(e.target.value)}>
                                        <option value="">Select Brand</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Vendor</label>
                                    <input readOnly
                                        type="text"
                                        className="form-control"
                                        placeholder="Vendor name"
                                        value={brands.find(b => b.id === brandId)?.name || ''}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Model Series</label>
                                    <select className="form-select" value={seriesId} onChange={e => fetchModels(e.target.value)} disabled={!brandId}>
                                        <option value="">Select Series</option>
                                        {modelSeries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Model <span className="text-danger">*</span></label>
                                    <select className="form-select" value={modelId} onChange={e => setModelId(e.target.value)} disabled={!seriesId}>
                                        <option value="">Select Model</option>
                                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Product description..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 text-end">
                                <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Options →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 - Options */}
                    {step === 2 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Product Options <small className="text-muted fw-normal">(e.g. Color, Storage)</small></h6>
                            {options.map((opt, optIdx) => (
                                <div key={optIdx} className="border rounded p-3 mb-3 bg-light">
                                    <div className="d-flex gap-2 align-items-center mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Option name (e.g. Color)"
                                            value={opt.name}
                                            onChange={e => updateOptionName(optIdx, e.target.value)}
                                        />
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeOption(optIdx)}>
                                            <CIcon icon={cilX} />
                                        </button>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {opt.values.map((val, valIdx) => (
                                            <div key={valIdx} className="input-group" style={{ width: '180px' }}>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Value"
                                                    value={val}
                                                    onChange={e => updateOptionValue(optIdx, valIdx, e.target.value)}
                                                />
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => removeOptionValue(optIdx, valIdx)}>
                                                    <CIcon icon={cilX} />
                                                </button>
                                            </div>
                                        ))}
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addOptionValue(optIdx)}>
                                            <CIcon icon={cilPlus} /> Value
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-outline-primary btn-sm" onClick={addOption}>
                                <CIcon icon={cilPlus} className="me-1" /> Add Option
                            </button>
                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>← Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Variants →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 - Variants */}
                    {step === 3 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Variants <small className="text-muted fw-normal">(SKU, Price, Stock)</small></h6>
                            <div className="table-responsive">
                                <table className="table table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>SKU <span className="text-danger">*</span></th>
                                            <th>Price <span className="text-danger">*</span></th>
                                            <th>Stock</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map((v, i) => (
                                            <tr key={i}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. APL-IP15-128-BLK"
                                                        value={v.sku}
                                                        onChange={e => updateVariant(i, 'sku', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        placeholder="0.00"
                                                        value={v.price}
                                                        onChange={e => updateVariant(i, 'price', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        placeholder="0"
                                                        value={v.inventory_quantity}
                                                        onChange={e => updateVariant(i, 'inventory_quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeVariant(i)}>
                                                        <CIcon icon={cilTrash} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button className="btn btn-outline-primary btn-sm" onClick={addVariant}>
                                <CIcon icon={cilPlus} className="me-1" /> Add Variant
                            </button>
                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(2)}>← Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Attributes →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4 - Attributes */}
                    {step === 4 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Attributes <small className="text-muted fw-normal">(Key-Value specs)</small></h6>
                            {attributes.map((attr, i) => (
                                <div key={i} className="row g-2 mb-2 align-items-center">
                                    <div className="col-md-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Key (e.g. RAM)"
                                            value={attr.key}
                                            onChange={e => updateAttribute(i, 'key', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Value (e.g. 8GB)"
                                            value={attr.value}
                                            onChange={e => updateAttribute(i, 'value', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => removeAttribute(i)}>
                                            <CIcon icon={cilTrash} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-outline-primary btn-sm mt-2" onClick={addAttribute}>
                                <CIcon icon={cilPlus} className="me-1" /> Add Attribute
                            </button>

                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(3)}>← Back</button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    <CIcon icon={cilNoteAdd} className="me-1" />
                                    {loading ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default AddProduct