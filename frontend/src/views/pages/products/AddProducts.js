import React, { useState, useEffect, useRef } from 'react'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import { cilPlus, cilX, cilTrash, cilNoteAdd, cilImage, cilArrowTop, cilArrowBottom, cilStar } from '@coreui/icons'

// Mock API functions - replace with your actual imports
import {
    get_cat_brands, get_categories, get_models, get_brand_series, save_product
} from '../../../api/system_service'

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

    // Step 2 - Options
    const [options, setOptions] = useState([{ name: '', values: [''] }])

    // Step 3 - Variants
    const [variants, setVariants] = useState([{ sku: '', price: '', inventory_quantity: 0 }])

    // Step 4 - Attributes
    const [attributes, setAttributes] = useState([{ key: '', value: '' }])

    // Step 5 - Images
    // Each entry: { file, previewUrl, altText, isPrimary, sortIndex }
    const [images, setImages] = useState([])
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(false)

    useEffect(() => { fetchInitial() }, [])

    useEffect(() => {
        if (brandId) fetchSeries(brandId)
        setSeriesId(''); setModelId(''); setModels([])
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

    useEffect(() => {
        const generated = generateCombinations(options, productName)
        // preserve prices/qty already typed by admin if variants existed before
        setVariants(prev =>
            generated.map(newV => {
                const existing = prev.find(p => p.label === newV.label)
                return existing
                    ? { ...newV, price: existing.price, inventory_quantity: existing.inventory_quantity }
                    : newV
            })
        )
    }, [options, productName])

    const fetchInitial = async () => {
        try {
            // const [b, c] = await Promise.all([get_brands(), get_categories()])
            // setBrands(b.data); setCategories(c.data)
            // setCategories([{ id: 1, name: 'Phones' }, { id: 2, name: 'Laptops' }])
            const cats = await get_categories(true);
            setCategories(cats.data);
            // setBrands([{ id: 1, name: 'Apple' }, { id: 2, name: 'Samsung' }])
        } catch (err) { console.log(err) }
    }

    const fetchSeries = async (bSlug) => {
        try {
            // const res = await (bId); setModelSeries(res.data)
            const res = await get_brand_series(bSlug)
            setModelSeries(res.data)
        } catch (err) { console.log(err) }
    }

    const fetchModels = async (sSlug) => {
        try {
            if (!categoryId || !brandId || !sSlug) return;
            const res = await get_models(categoryId, brandId, sSlug);
            setModels(res.data);
        } catch (err) { console.log(err) }
    }
    const brandsFromCat = async (catId) => {
        console.log(catId)
        setCategoryId(catId);
        await fetchBrands(catId);
    }
    const fetchBrands = async (catId) => {
        const brands = await get_cat_brands(catId);
        setBrands(brands.data);
    }

    // ── Options ───────────────────────────────────────────────
    const addOption = () => setOptions([...options, { name: '', values: [''] }])
    const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i))
    const updateOptionName = (i, val) => { const u = [...options]; u[i].name = val; setOptions(u) }
    const addOptionValue = (oi) => { const u = [...options]; u[oi].values.push(''); setOptions(u) }
    const removeOptionValue = (oi, vi) => { const u = [...options]; u[oi].values = u[oi].values.filter((_, i) => i !== vi); setOptions(u) }
    const updateOptionValue = (oi, vi, val) => { const u = [...options]; u[oi].values[vi] = val; setOptions(u) }

    // ── Variants ──────────────────────────────────────────────
    const generateCombinations = (options) => {
        if (options.length === 0) return [];

        const validOptions = options.filter(o => o.name && o.values.filter(v => v).length > 0)
        if (!validOptions.length) return []

        let combinations = [[]]

        for (const option of validOptions) {
            const validValues = option.values.filter(v => v.trim())
            combinations = combinations.flatMap(combo =>
                validValues.map(val => [...combo, { option: option.name, value: val }])
            )
        }

        return combinations.map(combo => ({
            label: combo.map(c => c.value).join(' / '),        // "Black / 128GB"  → display
            sku: generateSKU(productName, combo),                                             // admin can tweak or leave blank
            combo,
            price: '',
            inventory_quantity: 0
        }))
    }
    const generateSKU = (productName, combo) => {
        const base = productName
            .toUpperCase()
            .split(' ')
            .map(w => w.slice(0, 3))
            .join('-')
            .slice(0, 12)   // e.g. "IPH-15-128"

        const suffix = combo
            .map(c => c.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
            .join('-')       // e.g. "BLK-128G"

        return `${base}-${suffix}`
    }
    // console.log(generateSKU("iPhone 15", [{ option: 'Color', value: 'Black' }, { option: 'Storage', value: '128GB' }]))

    const addVariant = () => setVariants([...variants, { sku: '', price: '', inventory_quantity: 0 }])
    const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i))
    const updateVariant = (i, field, val) => { const u = [...variants]; u[i][field] = val; setVariants(u) }

    // ── Attributes ────────────────────────────────────────────
    const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }])
    const removeAttribute = (i) => setAttributes(attributes.filter((_, idx) => idx !== i))
    const updateAttribute = (i, field, val) => { const u = [...attributes]; u[i][field] = val; setAttributes(u) }

    // ── Images ────────────────────────────────────────────────
    const buildImageEntries = (files, existingCount) =>
        files.map((file, i) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            altText: '',
            isPrimary: existingCount === 0 && i === 0, // first image ever = primary
            sortIndex: existingCount + i + 1
        }))

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
        if (!files.length) return
        setImages(prev => [...prev, ...buildImageEntries(files, prev.length)])
        e.target.value = ''
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
        if (!files.length) return
        setImages(prev => [...prev, ...buildImageEntries(files, prev.length)])
    }

    const removeImage = (i) => {
        setImages(prev => {
            const updated = prev.filter((_, idx) => idx !== i)
            // if removed was primary, assign first remaining
            if (prev[i].isPrimary && updated.length > 0) updated[0] = { ...updated[0], isPrimary: true }
            return updated.map((img, idx) => ({ ...img, sortIndex: idx + 1 }))
        })
    }

    const setPrimary = (i) => setImages(images.map((img, idx) => ({ ...img, isPrimary: idx === i })))

    const updateAltText = (i, val) => { const u = [...images]; u[i].altText = val; setImages(u) }

    const moveImage = (i, dir) => {
        const newIdx = i + dir
        if (newIdx < 0 || newIdx >= images.length) return
        const u = [...images];
        [u[i], u[newIdx]] = [u[newIdx], u[i]]
        setImages(u.map((img, idx) => ({ ...img, sortIndex: idx + 1 })))
    }

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!productName || !brandId || !categoryId || !modelId) {
            return alert("Please fill all required fields in Step 1")
        }

        if (confirm(`Save product "${productName}"?`)) {
            setLoading(true)
            try {

                const payload = {
                    product: {
                        name: productName,
                        slug,
                        category_id: categories.find(c => c.slug === categoryId)?.id,
                        brand_id: brands.find(b => b.slug === brandId)?.id,
                        series_id: seriesId ? modelSeries.find(s => s.slug === seriesId)?.id : null,
                        model_id: Number(modelId),
                        description,
                        vendor: brands.find(b => b.slug === brandId)?.name || null
                    },
                    options: options
                        .filter(o => o.name && o.values.some(v => v.trim()))
                        .map(o => ({
                            name: o.name,
                            values: o.values.filter(v => v.trim())
                        })),
                    variants: variants.map(v => ({
                        label: v.label || null,
                        sku: v.sku,
                        price: Number(v.price) || 0,
                        inventory_quantity: Number(v.inventory_quantity) || 0,
                        combo: v.combo || []
                    })),
                    attributes: attributes
                        .filter(a => a.key && a.value)
                        .map(a => ({
                            key: a.key,
                            value: a.value
                        })),
                    imagesMeta: images.map(img => ({
                        alt_text: img.altText,
                        is_primary: img.isPrimary,
                        sort_index: img.sortIndex
                    }))
                }

                const formData = new FormData()

                // append structured JSON
                formData.append("data", JSON.stringify(payload))

                // append files (IMPORTANT: field name must match multer)
                images.forEach(img => {
                    formData.append("image", img.file)
                })

                await save_product(formData)

                alert("Product created successfully!")
                if (onSuccess) {
                    useNavigate.navigate('/products')
                    onSuccess();
                }
                
            } catch (err) {
                console.log(err)
                alert("Something went wrong.")
                navigator.navigate('/products')
            } finally {
                setLoading(false)
            }
        }
    }

    const steps = ['Basic Info', 'Options', 'Variants', 'Attributes', 'Images']

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h4 className="fw-bold text-uppercase mb-0">Add Product</h4>
                    <div className="d-flex gap-2 flex-wrap">
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

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Basic Information</h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold" onClick={() => console.log(generateCombinations)}>Product Name <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control" placeholder="e.g. iPhone 15 128GB Black"
                                        value={productName} onChange={e => setProductName(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Slug</label>
                                    <input type="text" className="form-control" value={slug} onChange={e => setSlug(e.target.value)} disabled={true} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                                    <select className="form-select" value={categoryId} onChange={e => brandsFromCat(e.target.value)}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Brand <span className="text-danger">*</span></label>
                                    <select className="form-select" value={brandId} onChange={e => setBrandId(e.target.value)} disabled={!categoryId}>
                                        <option value="">Select Brand</option>
                                        {brands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Vendor</label>
                                    <input type="text" className="form-control" placeholder="Vendor name"
                                        value={brands.find(b => b.slug === brandId)?.name || ''} disabled={true} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Model Series</label>
                                    <select className="form-select" value={seriesId} onChange={e => setSeriesId(e.target.value)} disabled={!brandId}>
                                        <option value="">Select Series</option>
                                        {modelSeries.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
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
                                    <textarea className="form-control" rows={3} placeholder="Product description..."
                                        value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-4 text-end">
                                <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Options →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Product Options <small className="text-muted fw-normal">(e.g. Color, Storage)</small></h6>
                            {options.map((opt, optIdx) => (
                                <div key={optIdx} className="border rounded p-3 mb-3 bg-light">
                                    <div className="d-flex gap-2 align-items-center mb-2">
                                        <input type="text" className="form-control" placeholder="Option name (e.g. Color)"
                                            value={opt.name} onChange={e => updateOptionName(optIdx, e.target.value)} />
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeOption(optIdx)}>
                                            <CIcon icon={cilX} />
                                        </button>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {opt.values.map((val, valIdx) => (
                                            <div key={valIdx} className="input-group" style={{ width: '180px' }}>
                                                <input type="text" className="form-control form-control-sm" placeholder="Value"
                                                    value={val} onChange={e => updateOptionValue(optIdx, valIdx, e.target.value)} />
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

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3 d-flex justify-content-between"><span>Variants <small className="text-muted fw-normal">(SKU, Price, Stock)</small></span>
                                <button onClick={generateCombinations} className="btn btn-success text-white">Generate</button>
                            </h6>
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
                                                <td><input type="text" className="form-control form-control-sm" placeholder="e.g. APL-IP15-128-BLK"
                                                    value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} /></td>
                                                <td><input type="number" className="form-control form-control-sm" placeholder="0.00"
                                                    value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} /></td>
                                                <td><input type="number" className="form-control form-control-sm" placeholder="0"
                                                    value={v.inventory_quantity} onChange={e => updateVariant(i, 'inventory_quantity', e.target.value)} /></td>
                                                <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeVariant(i)}><CIcon icon={cilTrash} /></button></td>
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

                    {/* STEP 4 */}
                    {step === 4 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Attributes <small className="text-muted fw-normal">(Key-Value specs)</small></h6>
                            {attributes.map((attr, i) => (
                                <div key={i} className="row g-2 mb-2 align-items-center">
                                    <div className="col-md-4">
                                        <input type="text" className="form-control" placeholder="Key (e.g. RAM)"
                                            value={attr.key} onChange={e => updateAttribute(i, 'key', e.target.value)} />
                                    </div>
                                    <div className="col-md-6">
                                        <input type="text" className="form-control" placeholder="Value (e.g. 8GB)"
                                            value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
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
                                <button className="btn btn-primary" onClick={() => setStep(5)}>Next: Images →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5 - Images */}
                    {step === 5 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                Product Images
                                <small className="text-muted fw-normal ms-2">
                                    — First image auto-set as primary. Click ★ to change. Use arrows to reorder.
                                </small>
                            </h6>

                            {/* Drop zone */}
                            <div
                                className="rounded p-4 text-center mb-4"
                                style={{ border: '2px dashed #dee2e6', cursor: 'pointer', background: '#f8f9fa' }}
                                onClick={() => fileInputRef.current.click()}
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                            >
                                <CIcon icon={cilImage} className="text-muted mb-2" style={{ width: 36, height: 36 }} />
                                <p className="text-muted mb-1 fw-semibold">Drag & drop images here</p>
                                <p className="text-muted small mb-0">or <span className="text-primary">browse files</span> — PNG, JPG, WEBP</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Image grid */}
                            {images.length > 0 ? (
                                <div className="row g-3 mb-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="col-md-3 col-sm-4 col-6">
                                            <div className={`card h-100 ${img.isPrimary ? 'border-warning border-2' : ''}`}>
                                                {/* Thumbnail */}
                                                <div className="position-relative">
                                                    <img
                                                        src={img.previewUrl}
                                                        alt={img.altText || 'preview'}
                                                        className="card-img-top"
                                                        style={{ height: '140px', objectFit: 'cover', borderRadius: '0.375rem 0.375rem 0 0' }}
                                                    />
                                                    {img.isPrimary && (
                                                        <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-1" style={{ fontSize: '0.7rem' }}>
                                                            ★ Primary
                                                        </span>
                                                    )}
                                                    <span className="badge bg-dark position-absolute top-0 end-0 m-1" style={{ fontSize: '0.7rem' }}>
                                                        #{img.sortIndex}
                                                    </span>
                                                    <button
                                                        className="btn btn-danger btn-sm position-absolute bottom-0 end-0 m-1 py-0 px-1"
                                                        onClick={() => removeImage(i)}
                                                        title="Remove image"
                                                        style={{ lineHeight: '1.4' }}
                                                    >
                                                        <CIcon icon={cilX} style={{ width: 12, height: 12 }} />
                                                    </button>
                                                </div>

                                                {/* Controls */}
                                                <div className="card-body p-2">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm mb-2"
                                                        placeholder="Alt text (SEO)"
                                                        value={img.altText}
                                                        onChange={e => updateAltText(i, e.target.value)}
                                                        maxLength={150}
                                                    />
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => moveImage(i, -1)}
                                                                disabled={i === 0}
                                                                title="Move left"
                                                            >
                                                                <CIcon icon={cilArrowTop} style={{ width: 11, height: 11 }} />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => moveImage(i, 1)}
                                                                disabled={i === images.length - 1}
                                                                title="Move right"
                                                            >
                                                                <CIcon icon={cilArrowBottom} style={{ width: 11, height: 11 }} />
                                                            </button>
                                                        </div>
                                                        {!img.isPrimary && (
                                                            <button
                                                                className="btn btn-sm btn-outline-warning"
                                                                onClick={() => setPrimary(i)}
                                                                title="Set as primary image"
                                                            >
                                                                <CIcon icon={cilStar} style={{ width: 12, height: 12 }} />
                                                                <span className="ms-1" style={{ fontSize: '0.75rem' }}>Set Primary</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add more tile */}
                                    <div className="col-md-3 col-sm-4 col-6">
                                        <div
                                            className="card h-100 border-dashed d-flex align-items-center justify-content-center text-muted"
                                            style={{ border: '2px dashed #dee2e6', cursor: 'pointer', minHeight: '200px' }}
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            <div className="text-center p-3">
                                                <CIcon icon={cilPlus} style={{ width: 28, height: 28 }} className="mb-1" />
                                                <p className="small mb-0">Add more</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted text-center py-2">No images added yet. Products can be saved without images.</p>
                            )}

                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(4)}>← Back</button>
                                <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
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
