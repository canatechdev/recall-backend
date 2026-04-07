import { useEffect, useMemo, useState } from 'react'
import { createBanner, getBanners, toggleBannerStatus, updateBanner } from '../../../api/banner.api'
import Swal from 'sweetalert2'
import ThemedTablePage from 'src/components/ThemedTablePage'

const HomeBanner = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  const [isBanner, setIsBanner] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)
  const [title, setTitle] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [position, setPosition] = useState('home')
  const [sortOrder, setSortOrder] = useState(0)
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const bannersPerPage = 5

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5500/api'
  const fileBase = apiBase.replace(/\/api\/?$/, '')

  const loadBanners = async () => {
    try {
      const res = await getBanners()
      setBanners(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  const toggleBanner = () => {
    setIsBanner(!isBanner)
    setIsEdit(false)
    setEditId(null)
    setTitle('')
    setRedirectUrl('')
    setPosition('home')
    setSortOrder(0)
    setFile(null)
    setImageUrl('')
  }

  const editBanner = (b) => {
    if (!b?.id) return
    setIsBanner(true)
    setIsEdit(true)
    setEditId(b.id)
    setTitle(b.title || '')
    setRedirectUrl(b.redirect_url || '')
    setPosition(b.position || 'home')
    setSortOrder(Number(b.sort_order || 0))
    setFile(null)
    setImageUrl(b.image_url || '')
  }

  const createBannerHandler = async () => {
    if (!title.trim() || !redirectUrl.trim() || !file) {
      return Swal.fire('Missing fields', 'Title, Redirect URL, and Image are required.', 'warning')
    }

    const res = await Swal.fire({
      title: 'Create Banner?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
    })
    if (!res.isConfirmed) return

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('redirect_url', redirectUrl.trim())
      formData.append('position', position)
      formData.append('sort_order', String(sortOrder || 0))
      formData.append('is_active', 'true')
      formData.append('image', file)
      await createBanner(formData)
      await loadBanners()
      toggleBanner()
      Swal.fire({ icon: 'success', title: 'Saved', timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', err.response?.data?.message || 'Failed to create banner', 'error')
    }
  }

  const updateBannerHandler = async () => {
    if (!editId) return
    if (!title.trim() || !redirectUrl.trim()) {
      return Swal.fire('Missing fields', 'Title and Redirect URL are required.', 'warning')
    }

    const res = await Swal.fire({
      title: 'Update Banner?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })
    if (!res.isConfirmed) return

    try {
      const current = banners.find((x) => x.id === editId)
      const currentActive = current ? Boolean(current.is_active) : true

      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('redirect_url', redirectUrl.trim())
      formData.append('position', position)
      formData.append('sort_order', String(sortOrder || 0))
      formData.append('is_active', currentActive ? 'true' : 'false')
      if (file) formData.append('image', file)

      await updateBanner(editId, formData)
      await loadBanners()
      toggleBanner()
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', err.response?.data?.message || 'Failed to update banner', 'error')
    }
  }

  const handleSubmit = () => {
    if (isEdit) updateBannerHandler()
    else createBannerHandler()
  }

  // STATUS TOGGLE
  const handleToggle = async (banner) => {
    try {
      const action = banner.is_active ? 'Suspend' : 'Enable'
      const res = await Swal.fire({
        title: `${action} Banner?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: action,
        cancelButtonText: 'Cancel',
      })
      if (!res.isConfirmed) return

      await toggleBannerStatus(banner.id, !banner.is_active)
      await loadBanners()
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to update status', 'error')
    }
  }

  const filteredBanners = useMemo(() => {
    const q = query.trim().toLowerCase()
    return banners
      .filter((b) => {
        if (statusFilter === 'enabled') return Boolean(b.is_active) === true
        if (statusFilter === 'suspended') return Boolean(b.is_active) === false
        return true
      })
      .filter((b) => {
        if (!q) return true
        return String(b?.title || '').toLowerCase().includes(q)
      })
  }, [banners, query, statusFilter])

  // PAGINATION LOGIC
  const indexOfLast = currentPage * bannersPerPage
  const indexOfFirst = indexOfLast - bannersPerPage
  const currentBanners = filteredBanners.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(filteredBanners.length / bannersPerPage)

  if (loading) return <p>Loading banners...</p>

  const rows = currentBanners.map((b, index) => ({ ...b, _rowIndex: indexOfFirst + index + 1 }))

  const columns = [
    { key: '_rowIndex', label: 'Sr No', render: (b) => b._rowIndex, headerStyle: { width: 80 } },
    {
      key: 'image',
      label: 'Image',
      render: (b) => (
        <img
          src={`${fileBase}${b.image_url}`}
          alt={b.title}
          style={{ width: 260, height: 90, objectFit: 'cover', borderRadius: 6 }}
        />
      ),
    },
    { key: 'title', label: 'Title', render: (b) => b.title },
    { key: 'position', label: 'Position', render: (b) => b.position },
    { key: 'sort_order', label: 'Order', render: (b) => b.sort_order },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (b) => (b.is_active ? 'Enabled' : 'Suspended'),
    },
    {
      key: 'action',
      label: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (b) => (
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-success" onClick={() => editBanner(b)}>
            Edit
          </button>
          <button
            className={`btn btn-sm btn-outline-${b.is_active ? 'danger' : 'info'}`}
            onClick={() => handleToggle(b)}
          >
            {b.is_active ? 'Suspend' : 'Enable'}
          </button>
        </div>
      ),
    },
  ]

  const filtersContent = (
    <div className="d-grid gap-2">
      <div>
        <div className="small text-medium-emphasis mb-1">Search</div>
        <input
          className="form-control form-control-sm"
          placeholder="Search banner title"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      <div>
        <div className="small text-medium-emphasis mb-1">Status</div>
        <select
          className="form-select form-select-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
        >
          <option value="all">All</option>
          <option value="enabled">Enabled</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          setQuery('')
          setStatusFilter('all')
          setCurrentPage(1)
        }}
        disabled={!query && statusFilter === 'all'}
      >
        Reset
      </button>
    </div>
  )

  const topContent = (
    <>
      <div className="mb-3">
        <h4 className="fw-bold mb-0 text-uppercase">Home Banners</h4>
      </div>

      {isBanner && (
        <div className="row g-2 mb-4 align-items-center">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Redirect URL"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="col-md-1">
            <input
              className="form-control"
              type="number"
              placeholder="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value || 0))}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {imageUrl && (
            <div className="col-md-1">
              <img
                src={`${fileBase}${imageUrl}`}
                alt="Banner"
                style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }}
              />
            </div>
          )}
          <div className={`col-md-${imageUrl ? '12' : '12'} d-flex justify-content-end gap-2`}>
            <button className="btn btn-success" onClick={handleSubmit}>
              {isEdit ? 'Update' : 'Save'}
            </button>
            <button className="btn btn-outline-secondary" onClick={toggleBanner}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="container py-4">
      <ThemedTablePage
        actions={{
          filtersContent,
          onExport: null,
          primary: !isBanner
            ? {
                label: 'Add Banner',
                color: 'success',
                onClick: toggleBanner,
              }
            : null,
        }}
        topContent={topContent}
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        loading={loading}
        emptyText={filteredBanners.length === 0 ? 'No banners found' : 'No banners match your filters'}
        footerLeft={
          <div className="small text-medium-emphasis">
            Showing {rows.length} of {filteredBanners.length} banners
          </div>
        }
        pagination={
          totalPages > 1
            ? {
                page: currentPage,
                totalPages,
                onChange: (p) => setCurrentPage(p),
              }
            : null
        }
      />
    </div>
  )
}

export default HomeBanner
