import axios from "./axios"

export const getFaqs = () => axios.get("/faqs")

export const createFaq = (data) => axios.post("/faqs", data)

export const updateFaq = (id, data) => axios.put(`/faqs/${id}`, data)

export const deleteFaq = (id) => axios.delete(`/faqs/${id}`)

// UPDATE FAQ STATUS
export const toggleFaqStatus = (id, status) =>
  axios.patch(`/faqs/${id}/status`, { status })