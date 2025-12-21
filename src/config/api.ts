// Environment configuration for API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const API_ENDPOINTS = {
  BOOKING_CONFIRMATION: `${API_BASE_URL}/api/send-booking-confirmation`,
  HEALTH_CHECK: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;
