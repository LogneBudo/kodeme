// Environment configuration for API endpoints
// Use Vite env `VITE_BACKEND_URL` to point to the backend server (e.g. http://localhost:4000)
// If not set, fall back to the same-origin `/api` path.
const backend = (import.meta.env?.VITE_BACKEND_URL as string) || "";
const API_BASE_URL = backend ? `${backend.replace(/\/$/, "")}/api` : "/api";

export const API_ENDPOINTS = {
  BOOKING_CONFIRMATION: `${API_BASE_URL}/send-booking-confirmation`,
  HEALTH_CHECK: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;
