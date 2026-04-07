import { useState } from 'react'
import { createBanner } from '../../../api/banner.api'
import { useNavigate } from 'react-router-dom'

const AddHomeBanner = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    image: null,
    redirect_url: '',
    position: 'home',
    sort_order: 0,
    is_active: true,
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm({
        ...form,
        image: e.target.files[0],
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Safety check
    if (!form.image) {
      alert('Please select an image')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('image', form.image) // 🔥 FILE
      formData.append('redirect_url', form.redirect_url)
      formData.append('position', form.position)
      formData.append('sort_order', Number(form.sort_order))
      formData.append('is_active', form.is_active)
      await createBanner(formData)

      alert('Banner created successfully')
      navigate('/banners')
    } catch (error) {
      console.error(error)
      alert('Failed to create banner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <strong>Add Home Banner</strong>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Title */}
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter banner title"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label">Upload Image *</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              required
              onChange={handleImageChange}
            />
          </div>

          {/* Redirect URL */}
          <div className="mb-3">
            <label className="form-label">Redirect URL</label>
            <input
              type="text"
              name="redirect_url"
              className="form-control"
              value={form.redirect_url}
              onChange={handleChange}
              placeholder="/products"
            />
          </div>

          {/* Position */}
          <div className="mb-3">
            <label className="form-label">Position</label>
            <select
              name="position"
              className="form-select"
              value={form.position}
              onChange={handleChange}
            >
              <option value="home">Home</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="mb-3">
            <label className="form-label">Sort Order</label>
            <input
              type="number"
              name="sort_order"
              className="form-control"
              value={form.sort_order}
              onChange={handleChange}
            />
          </div>

          {/* Toggle active status */}
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <label className="form-check-label">{form.is_active ? 'Active' : 'Inactive'}</label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Create Banner'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddHomeBanner
