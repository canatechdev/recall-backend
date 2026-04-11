import axios from "./axios"

export const getFaqs = () => axios.get("/api/faqs")

export const createFaq = (data) => axios.post("/api/faqs", data)

export const updateFaq = (id, data) => axios.put(`/api/faqs/${id}`, data)

export const deleteFaq = (id) => axios.delete(`/api/faqs/${id}`)

// UPDATE FAQ STATUS
export const toggleFaqStatus = (id, status) =>
  axios.patch(`api/faqs/${id}/status`, { status })