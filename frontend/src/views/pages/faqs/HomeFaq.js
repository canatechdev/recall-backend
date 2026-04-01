import { useEffect, useMemo, useState } from 'react'
import { createFaq, getFaqs, toggleFaqStatus, updateFaq } from '../../../api/faq.api'
import Swal from 'sweetalert2'
import ThemedTablePage from 'src/components/ThemedTablePage'

const HomeFaqs = () => {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)

  const [isFaq, setIsFaq] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const faqsPerPage = 10
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const toggleFaq = () => {
    setIsFaq(!isFaq)
    setIsEdit(false)
    setEditId(null)
    setQuestion('')
    setAnswer('')
  }

  const editFaq = (faq) => {
    if (!faq?.id) return
    setIsFaq(true)
    setIsEdit(true)
    setEditId(faq.id)
    setQuestion(faq.question || '')
    setAnswer(faq.answer || '')
  }

  const createFaqHandler = async () => {
    if (!question.trim() || !answer.trim()) {
      return Swal.fire('Missing fields', 'Question and Answer are required.', 'warning')
    }

    const res = await Swal.fire({
      title: 'Create FAQ?',
      text: 'Save this FAQ now?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
    })

    if (!res.isConfirmed) return

    try {
      await createFaq({ question: question.trim(), answer: answer.trim(), status: true })
      await loadFaqs()
      toggleFaq()
      Swal.fire({ icon: 'success', title: 'Saved', timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', err.response?.data?.message || 'Failed to create FAQ', 'error')
    }
  }

  const updateFaqHandler = async () => {
    if (!editId) return
    if (!question.trim() || !answer.trim()) {
      return Swal.fire('Missing fields', 'Question and Answer are required.', 'warning')
    }

    const res = await Swal.fire({
      title: 'Update FAQ?',
      text: 'Apply these changes?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })

    if (!res.isConfirmed) return

    try {
      const current = faqs.find((f) => f.id === editId)
      const currentStatus = current ? Boolean(current.status) : true
      await updateFaq(editId, { question: question.trim(), answer: answer.trim(), status: currentStatus })
      await loadFaqs()
      toggleFaq()
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      Swal.fire('Error', err.response?.data?.message || 'Failed to update FAQ', 'error')
    }
  }

  const handleSubmit = () => {
    if (isEdit) updateFaqHandler()
    else createFaqHandler()
  }

  // TOGGLE STATUS
  const handleToggle = async (faq) => {
    try {
      const action = faq.status ? 'Suspend' : 'Enable'
      const res = await Swal.fire({
        title: `${action} FAQ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: action,
        cancelButtonText: 'Cancel',
      })

      if (!res.isConfirmed) return

      const newStatus = !faq.status
      await toggleFaqStatus(faq.id, newStatus)
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, status: newStatus } : f)))
    } catch (err) {
      console.error(err)
      Swal.fire('Error', 'Failed to update status', 'error')
    }
  }

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faqs
      .filter((f) => {
        if (statusFilter === 'enabled') return Boolean(f.status) === true
        if (statusFilter === 'suspended') return Boolean(f.status) === false
        return true
      })
      .filter((f) => {
        if (!q) return true
        return String(f?.question || '').toLowerCase().includes(q)
      })
  }, [faqs, query, statusFilter])

  // PAGINATION
  const indexOfLast = currentPage * faqsPerPage
  const indexOfFirst = indexOfLast - faqsPerPage
  const currentFaqs = filteredFaqs.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(filteredFaqs.length / faqsPerPage)

  const rows = currentFaqs.map((f, index) => ({ ...f, _rowIndex: indexOfFirst + index + 1 }))

  const columns = [
    { key: '_rowIndex', label: 'Sr No', render: (f) => f._rowIndex, headerStyle: { width: 80 } },
    { key: 'question', label: 'Question', render: (f) => f.question },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (f) => (Boolean(f.status) ? 'Enabled' : 'Suspended'),
    },
    {
      key: 'action',
      label: 'Action',
      render: (f) => (
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-success" onClick={() => editFaq(f)}>
            Edit
          </button>
          <button
            className={`btn btn-sm btn-outline-${Boolean(f.status) ? 'danger' : 'info'}`}
            onClick={() => handleToggle(f)}
          >
            {Boolean(f.status) ? 'Suspend' : 'Enable'}
          </button>
        </div>
      ),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
    },
  ]

  const filtersContent = (
    <div className="d-grid gap-2">
      <div>
        <div className="small text-medium-emphasis mb-1">Search</div>
        <input
          className="form-control form-control-sm"
          placeholder="Search question"
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

  return (
    <div className="container py-4">
      <ThemedTablePage
        actions={{
          filtersContent,
          onExport: null,
          primary: !isFaq
            ? {
                label: 'Add FAQ',
                color: 'success',
                onClick: toggleFaq,
              }
            : null,
        }}
        topContent={
          <>
            <div className="mb-3">
              <h4 className="fw-bold mb-0 text-uppercase">Manage FAQs</h4>
            </div>

            {isFaq && (
              <div className="row g-2 mb-4 align-items-start">
                <div className="col-12 col-md-5">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-5">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-2 d-flex justify-content-end gap-2">
                  <button className="btn btn-success" onClick={handleSubmit}>
                    {isEdit ? 'Update' : 'Save'}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={toggleFaq}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        }
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        loading={loading}
        emptyText={filteredFaqs.length === 0 ? 'No FAQs found' : 'No FAQs match your filters'}
        footerLeft={
          <div className="small text-medium-emphasis">
            Showing {rows.length} of {filteredFaqs.length} FAQs
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

export default HomeFaqs
