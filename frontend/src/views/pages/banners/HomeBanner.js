import { useEffect, useState } from 'react'
import { getBanners, toggleBannerStatus } from '../../../api/banner.api'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import ThemedTablePage from 'src/components/ThemedTablePage'

const HomeBanner = () => {
  const navigate = useNavigate()

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5500/').replace(/\/$/, '')

  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const bannersPerPage = 5
  const [query, setQuery] = useState('')

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

  // STATUS TOGGLE
  const handleToggle = async (banner) => {
    try {
      await toggleBannerStatus(banner.id, !banner.is_active)
      await loadBanners()
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to update status', 'error')
    }
  }

  const handleSuspend = async (banner) => {
    const willSuspend = Boolean(banner?.is_active)
    const result = await Swal.fire({
      title: willSuspend ? 'Suspend Banner?' : 'Activate Banner?',
      text: willSuspend
        ? 'This banner will be suspended (soft delete).'
        : 'This banner will become active again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: willSuspend ? '#d33' : '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: willSuspend ? 'Yes, suspend' : 'Yes, activate',
    })

    if (!result.isConfirmed) return
    await handleToggle(banner)
  }

  const filteredBanners = query.trim()
    ? banners.filter((b) => String(b?.title || '').toLowerCase().includes(query.trim().toLowerCase()))
    : banners

  // PAGINATION LOGIC
  const indexOfLast = currentPage * bannersPerPage
  const indexOfFirst = indexOfLast - bannersPerPage
  const currentBanners = filteredBanners.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(filteredBanners.length / bannersPerPage)

  const rows = currentBanners.map((b, index) => ({ ...b, _rowIndex: indexOfFirst + index + 1 }))

  const columns = [
    { key: '_rowIndex', label: 'Sr No', render: (b) => b._rowIndex, headerStyle: { width: 80 } },
    {
      key: 'image',
      label: 'Image',
      render: (b) => (
        <img
          src={`${apiBase}${b.image_url}`}
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
      render: (b) => (
        <span className={`badge ${b.is_active ? 'bg-success' : 'bg-secondary'}`}>
          {b.is_active ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (b) => (
        <>
          <button className="btn btn-sm btn-primary me-2" onClick={() => navigate(`/banners/edit/${b.id}`)}>
            Edit
          </button>
          <button
            className={`btn btn-sm ${b.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
            onClick={() => handleSuspend(b)}
            title={b.is_active ? 'Suspend (soft delete)' : 'Activate'}
          >
            {b.is_active ? 'Suspend' : 'Activate'}
          </button>
        </>
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
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          setQuery('')
          setCurrentPage(1)
        }}
        disabled={!query}
      >
        Reset
      </button>
    </div>
  )

  return (
    <div className="container py-4">
      <ThemedTablePage
        actions={{
          filtersContent,
          onExport: null,
          primary: {
            label: 'Add Banner',
            color: 'success',
            onClick: () => navigate('/banners/add'),
          },
        }}
        topContent={<div className="mb-3"><h4 className="fw-bold mb-0 text-uppercase">Home Banners</h4></div>}
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
