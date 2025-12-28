// Type declarations for Google Maps JavaScript API
// This helps TypeScript understand the google.maps objects

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

export {};
