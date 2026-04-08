import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBannerById, updateBanner } from '../../../api/banner.api'

const EditBanner = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5500/').replace(/\/$/, '')

  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    redirect_url: '',
    position: 'home',
    sort_order: 0,
    is_active: true
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // Load Banner
  const loadBanner = async () => {
    try {
      const res = await getBannerById(id)
      const banner = res.data.data

      setForm({
        title: banner.title || '',
        redirect_url: banner.redirect_url || '',
        position: banner.position || 'home',
        sort_order: banner.sort_order || 0,
        is_active: banner.is_active
      })

      if (banner.image_url) {
        setImagePreview(`${apiBase}${banner.image_url}`)
      }

    } catch (err) {
      console.error('Error loading banner:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadBanner()
  }, [id])

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Handle Image Upload
  const handleImage = (e) => {
    const file = e.target.files[0]

    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Submit Update
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()

    formData.append('title', form.title)
    formData.append('redirect_url', form.redirect_url)
    formData.append('position', form.position)
    formData.append('sort_order', Number(form.sort_order))

    // Important for PostgreSQL boolean handling
    formData.append('is_active', form.is_active ? 'true' : 'false')

    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      await updateBanner(id, formData)

      alert('Banner updated successfully')
      navigate('/banners')

    } catch (err) {
      console.error(err)
      alert('Failed to update banner')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Loading banner...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <strong>Edit Banner</strong>
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
              required
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

          {/* Banner Image */}
          <div className="mb-3">
            <label className="form-label">Banner Image</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImage}
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3">
              <img
                src={imagePreview}
                alt="Banner Preview"
                style={{
                  width: '250px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '5px'
                }}
              />
            </div>
          )}

          {/* Status Toggle */}
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <label className="form-check-label">
              {form.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-success">
            Update Banner
          </button>

        </form>
      </div>
    </div>
  )
}

export default EditBanner