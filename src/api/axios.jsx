import axios from "axios";

/* ================= API INSTANCE ================= */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const storedAuth = JSON.parse(localStorage.getItem("auth"));

    if (storedAuth?.accessToken) {
      config.headers.Authorization = `Bearer ${storedAuth.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("auth");

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    if (status === 403) {
      console.error("Admin access forbidden");
    }

    if (!error.response) {
      console.error("Network error or server down");
    }

    return Promise.reject(error);
  }
);

export default api;