// Google Maps Configuration
// Replace with your actual Google Maps API key
// To get an API key: https://developers.google.com/maps/documentation/javascript/get-api-key

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
export const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN || '';

// Attiki region bounds for restaurant search
export const ATTIKI_BOUNDS = {
  southwest: { lat: 37.8, lng: 23.5 },
  northeast: { lat: 38.2, lng: 24.1 },
};
