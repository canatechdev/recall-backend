import { useEffect, useState } from 'react'
import { getBanners, deleteBanner, toggleBannerStatus } from '../../../api/banner.api'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

const HomeBanner = () => {
  const navigate = useNavigate()

  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const bannersPerPage = 5

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

  // DELETE
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Banner?',
      text: 'This banner will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
    })

    if (result.isConfirmed) {
      try {
        await deleteBanner(id)
        await loadBanners()

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Banner deleted successfully',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (err) {
        console.error(err)
        Swal.fire('Error', 'Failed to delete banner', 'error')
      }
    }
  }

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

  // PAGINATION LOGIC
  const indexOfLast = currentPage * bannersPerPage
  const indexOfFirst = indexOfLast - bannersPerPage
  const currentBanners = banners.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(banners.length / bannersPerPage)

  if (loading) return <p>Loading banners...</p>

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Home Banners</strong>

        <button className="btn btn-sm btn-success" onClick={() => navigate('/banners/add')}>
          Add Banner
        </button>
      </div>

      <div className="card-body">
        {banners.length === 0 ? (
          <p>No banners found</p>
        ) : (
          <>
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Position</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th width="160">Action</th>
                </tr>
              </thead>

              <tbody>
                {currentBanners.map((b, index) => (
                  <tr key={b.id}>
                    <td>{indexOfFirst + index + 1}</td>

                    <td>
                      <img
                        src={`http://localhost:5500${b.image_url}`}
                        alt={b.title}
                        style={{
                          width: 260,
                          height: 90,
                          objectFit: 'cover',
                          borderRadius: 6,
                        }}
                      />
                    </td>

                    <td>{b.title}</td>
                    <td>{b.position}</td>
                    <td>{b.sort_order}</td>

                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={b.is_active}
                          onChange={() => handleToggle(b)}
                        />
                      </div>
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => navigate(`/banners/edit/${b.id}`)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination">

                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                      Previous
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, i) => (
                    <li
                      key={i}
                      className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                      Next
                    </button>
                  </li>

                </ul>
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HomeBanner
