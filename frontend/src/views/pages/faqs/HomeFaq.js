import { useEffect, useState } from 'react'
import { getFaqs, deleteFaq, toggleFaqStatus } from '../../../api/faq.api'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

const HomeFaqs = () => {
  const navigate = useNavigate()

  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const faqsPerPage = 10

  const loadFaqs = async () => {
    try {
      const res = await getFaqs()
      setFaqs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaqs()
  }, [])

  // DELETE FAQ
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete FAQ?',
      text: 'This FAQ will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
    })

    if (result.isConfirmed) {
      try {
        await deleteFaq(id)
        await loadFaqs()

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'FAQ deleted successfully.',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (err) {
        console.error(err)
        Swal.fire('Error', 'Failed to delete FAQ', 'error')
      }
    }
  }

  // TOGGLE STATUS
  const handleToggle = async (faq) => {
    try {
      const newStatus = !faq.status

      await toggleFaqStatus(faq.id, newStatus)

      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, status: newStatus } : f))
      )
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to update status', 'error')
    }
  }

  // PAGINATION
  const indexOfLast = currentPage * faqsPerPage
  const indexOfFirst = indexOfLast - faqsPerPage
  const currentFaqs = faqs.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(faqs.length / faqsPerPage)

  if (loading) return <p>Loading FAQs...</p>

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Manage FAQs</strong>

        <button
          className="btn btn-sm btn-success"
          onClick={() => navigate('/faqs/add')}
        >
          Add FAQ
        </button>
      </div>

      <div className="card-body">
        {faqs.length === 0 ? (
          <p>No FAQs found</p>
        ) : (
          <>
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Question</th>
                  <th>Status</th>
                  <th width="160">Action</th>
                </tr>
              </thead>

              <tbody>
                {currentFaqs.map((f, index) => (
                  <tr key={f.id}>
                    <td>{indexOfFirst + index + 1}</td>

                    <td>{f.question}</td>

                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={Boolean(f.status)}
                          onChange={() => handleToggle(f)}
                        />
                      </div>
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => navigate(`/faqs/edit/${f.id}`)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(f.id)}
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
              <ul className="pagination">

                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>

                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i}
                    className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? 'disabled' : ''
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </li>

              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HomeFaqs
