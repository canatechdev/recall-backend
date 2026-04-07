import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "../../../api/axios"
import Swal from "sweetalert2"

import { CKEditor } from "@ckeditor/ckeditor5-react"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"

const EditFaq = () => {

  const navigate = useNavigate()
  const { id } = useParams()

  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState(true)
  const [loading, setLoading] = useState(true)

  // LOAD FAQ
  const loadFaq = async () => {
    try {
      const res = await axios.get(`/faqs/${id}`)
      const faq = res.data

      setQuestion(faq.question)
      setAnswer(faq.answer)
      setStatus(faq.status)

    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Failed to load FAQ", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaq()
  }, [])

  // UPDATE FAQ
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!question.trim()) {
      Swal.fire("Validation", "Question is required", "warning")
      return
    }

    if (!answer.trim()) {
      Swal.fire("Validation", "Answer is required", "warning")
      return
    }

    try {

      await axios.put(`/faqs/${id}`, {
        question,
        answer,
        status
      })

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "FAQ updated successfully",
        timer: 1500,
        showConfirmButton: false
      })

      navigate("/faqs")

    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Failed to update FAQ", "error")
    }
  }

  if (loading) return <p>Loading FAQ...</p>

  return (
    <div className="card">

      <div className="card-header">
        <strong>Edit FAQ</strong>
      </div>

      <div className="card-body">

        <form onSubmit={handleSubmit}>

          {/* QUESTION */}
          <div className="mb-3">
            <label className="form-label">Question</label>
            <input
              type="text"
              className="form-control"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* ANSWER */}
          <div className="mb-3">
            <label className="form-label">Answer</label>

            <CKEditor
              editor={ClassicEditor}
              data={answer}
              onChange={(event, editor) => {
                const data = editor.getData()
                setAnswer(data)
              }}
            />
          </div>

          {/* STATUS */}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            <label className="form-check-label">
              Active
            </label>
          </div>

          {/* BUTTONS */}
          <button type="submit" className="btn btn-primary">
            Update FAQ
          </button>

          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => navigate("/faqs")}
          >
            Cancel
          </button>

        </form>

      </div>
    </div>
  )
}

export default EditFaq
