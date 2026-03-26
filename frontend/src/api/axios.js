import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout or redirect
            console.warn("Unauthorized - redirecting...");
        }

        if (error.response?.status >= 500) {
            console.warn("Server error");
        }

        return Promise.reject(error);
    }
);

export default api;