import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createFaq } from "../../../api/faq.api"
import Swal from "sweetalert2"

import { CKEditor } from "@ckeditor/ckeditor5-react"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"

const AddFaq = () => {

  const navigate = useNavigate()

  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState(true)
  const [loading, setLoading] = useState(false)

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

      setLoading(true)

      await createFaq({
        question,
        answer,
        status
      })

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "FAQ added successfully",
        timer: 1500,
        showConfirmButton: false
      })

      navigate("/faqs")

    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Failed to add FAQ", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">

      <div className="card-header">
        <strong>Add FAQ</strong>
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
              placeholder="Enter FAQ question"
            />
          </div>

          {/* ANSWER CKEDITOR */}

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

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save FAQ"}
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

export default AddFaq
