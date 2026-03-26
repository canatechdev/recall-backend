import React, { useEffect, useState } from 'react'
import { get_cat_brands, delete_brand, create_brand, get_categories } from "src/api/system_service"
import CIcon from '@coreui/icons-react'
import { cilNoteAdd, cilPlus, cilX } from '@coreui/icons'

const Brands = () => {
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [isBrand, setIsBrand] = useState(false)
    const [toast, setToast] = useState(null);

    const [brand, setBrand] = useState("")
    const [category, setCategory] = useState("")
    const [file, setFile] = useState("")

    const toggleBrand = () => setIsBrand(!isBrand)

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
                setCategory(response.data[0]?.slug || "")
                fetchBrands(response.data[0]?.slug || "")
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [])

    const createBrand = async () => {
        if (!brand || !category || !file) return showToast("danger", "Brand Name, Category & Image are required")
        if (confirm(`Is spelled "${brand}" correct?`)) {
            const catObj = categories.find(c => c.slug === category);
            if (!catObj) return showToast("danger", "Invalid category selected");
            try {
                const formData = new FormData();
                formData.append("name", brand);
                formData.append("category_id", catObj.id);
                formData.append("image", file);
                await create_brand(formData);
                showToast("success", "Brand saved successfully!");
                fetchBrands(category);
                toggleBrand();
                setBrand("");
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to Save Brand.");
            }
        }
    }
    // ── API calls ────────────────────────────────────────────
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };
    const deleteBrand = async (id) => {
        if (!id) return
        if (confirm("Delete this Brand?")) {
            const response = await delete_brand(id)
            if (response.status === 200) {
                setBrands(brands.filter(b => b.id !== id))
            }
        }
    }
    const setBrandsByCategory = (catSlug) => {
        fetchBrands(catSlug);
        setCategory(catSlug)
    }

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0 text-uppercase d-flex">
                        <span className="my-auto">Manage Brands :</span>
                        <select style={{ 'outline': 'none' }} className="no-arrow border-0 d-inline-block w-auto ms-2 text-uppercase h6 my-auto" value={category}
                            onChange={(e) => setBrandsByCategory(e.target.value)} >
                            {categories.map((cat) => (
                                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select> </h4>
                    {!isBrand && (
                        <button onClick={toggleBrand} className="btn btn-primary">
                            <CIcon icon={cilPlus} className="me-1" />
                            Add Brand
                        </button>
                    )}
                </div>

                <div className="card-body">
                    {isBrand && (
                        <div className="row g-2 mb-4 align-items-center">
                            <div className="col-md-4">
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                    className="form-control"
                                    placeholder="Enter unique Brand name"
                                />
                            </div>
                            <div className="col-md-3">
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="form-control"
                                    placeholder="Category name" />
                            </div>
                            <div className="col-md-2 d-flex gap-2">
                                <button onClick={createBrand} className="btn btn-md-md btn-sm btn-success me-2 text-white">
                                    Save
                                </button>
                                <button onClick={toggleBrand} className="btn btn-sm btn-secondary">

                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr className="text-center">
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Image</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {brands.length ? brands.map((ele, index) => (
                                    <tr key={ele.id} className="text-center">
                                        <td className="text-center">{index + 1}</td>
                                        <td>{ele.name}</td>
                                        <td><img className="rounded" src={import.meta.env.VITE_API_URL + "uploads/" + ele.url} alt="" style={{ width: '3rem' }} /></td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-outline-success me-2">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteBrand(ele.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-4">
                                            No Brands Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Brands