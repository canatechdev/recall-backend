import React, { useEffect, useState } from 'react'
import { get_services, delete_service, create_service } from "src/api/system_service"
import CIcon from '@coreui/icons-react'
import { cilNoteAdd, cilPlus, cilX } from '@coreui/icons'

const Services = () => {
    const [services, setServices] = useState([])
    const [isService, setIsService] = useState(false)
    const [service, setService] = useState("")
    const [file, setFile] = useState(null)

    const toggleService = () => setIsService(!isService)

    const fetchServices = async () => {
        try {
            const response = await get_services()
            if (response.status === 200) setServices(response.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const createService = async (e) => {
        e.preventDefault();
        if (!service || !file) return alert("Service & Image are required")
        if (confirm(`Is spelled "${service}" correct?`)) {
            const formData = new FormData();
            formData.append("name", service);
            formData.append("image", file);
            console.log(formData.get('image'));

            const response = await create_service(formData)
            if (response.status === 200) {
                fetchServices()
                toggleService()
                setService("")
            }
        }
    }

    const deleteService = async (id) => {
        if (!id) return
        if (confirm("Delete this service?")) {
            const response = await delete_service(id)
            if (response.status === 200) {
                setServices(services.filter(s => s.id !== id))
            }
        }
    }

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0 text-uppercase">Manage Services</h4>

                    {!isService && (
                        <button onClick={toggleService} className="btn btn-primary">
                            <CIcon icon={cilPlus} className="me-1" />
                            Add Service
                        </button>
                    )}
                </div>

                <div className="card-body">
                    {isService && (
                        <div className="row g-2 mb-4 align-items-center">
                            <div className="col-md-5">
                                <input
                                    type="text"
                                    value={service}
                                    onChange={e => setService(e.target.value)}
                                    className="form-control"
                                    placeholder="Enter unique service name"
                                />
                            </div>
                            <div className="col-md-4 d-flex justify-content-center">
                                <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
                            </div>
                            <div className="col-md-3">
                                <button onClick={createService} className="btn btn-success me-2">
                                    <CIcon icon={cilNoteAdd} className="me-1" />
                                    Save
                                </button>
                                <button onClick={toggleService} className="btn btn-outline-secondary">
                                    <CIcon icon={cilX} className="me-1" />
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
                                {services.length ? services.map((ele, index) => (
                                    <tr key={ele.id} className="text-center">
                                        <td className="text-center">{index + 1}</td>
                                        <td>{ele.name}</td>
                                        <td><img className="rounded" src={import.meta.env.VITE_API_URL+"uploads/" + ele.url} alt="" style={{width:'3rem'}} /></td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-outline-success me-2">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteService(ele.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-4">
                                            No Services Found
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

export default Services
