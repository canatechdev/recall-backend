import React, { useState, useEffect } from 'react'
import { get_categories, delete_category, create_category } from '../../../api/system_service'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilNoteAdd, cilX } from '@coreui/icons'

const Categories = () => {
    const [categories, setCategories] = useState([])
    const [isCategory, setIsCategory] = useState(false)
    const [name, setName] = useState("")
    const [parent, setParent] = useState("")
    const [file, setFile] = useState("")
    const [toast, setToast] = useState(null)

    const toggleCategory = () => setIsCategory(!isCategory)

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

    const createCategory = async () => {
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
                setName("");
                setParent("");
                toggleCategory();
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to create category.");
            }
        }
    }

    const deleteCategory = async (id) => {
        if (!id) return
        if (confirm("Delete this category?")) {
            try {
                await delete_category(id);
                showToast("success", "Category deleted");
                setCategories(categories.filter(cat => cat.id !== id));
            } catch (err) {
                showToast("danger", err.response?.data?.message || "Failed to delete category.");
            }
        }
    }

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
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold text-uppercase mb-0">Manage Categories</h4>

                    {!isCategory && (
                        <button onClick={toggleCategory} className="btn btn-primary">
                            <CIcon icon={cilPlus} className="me-1" />
                            Add Category
                        </button>
                    )}
                </div>

                <div className="card-body">

                    {isCategory && (
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
                                    placeholder="Category name"
                                />
                            </div>

                            <div className="col-md-3">
                                <select
                                    value={parent}
                                    onChange={(e) => setParent(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">No Parent</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <button onClick={createCategory} className="btn btn-success me-2">
                                    <CIcon icon={cilNoteAdd} className="me-1" />
                                    Save
                                </button>
                                <button onClick={toggleCategory} className="btn btn-outline-secondary">
                                    <CIcon icon={cilX} className="me-1" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light text-center">
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Parent</th>
                                    <th>Image</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody className="text-center">
                                {categories.length ? categories.map((ele, index) => (
                                    <tr key={ele.id}>
                                        <td>{index + 1}</td>
                                        <td>{ele.name}</td>
                                        <td>{ele.parent || '-'}</td>
                                        <td><img className="rounded" src={import.meta.env.VITE_API_URL + "uploads/" + ele.url} alt="" style={{ width: '3rem' }} /></td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-success me-2">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(ele.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 text-muted">
                                            No Categories Found
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

export default Categories
