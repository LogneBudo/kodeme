// Google Maps API Loader
// This script dynamically loads the Google Maps JavaScript API

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Create callback
    (window as any).initGoogleMaps = () => {
      resolve();
    };

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });
};
