/**
 * Dynamic Google Maps & Places JavaScript API Loader
 * Safely loads the Google Maps SDK only when a valid API key is present in environment variables.
 * Prevents 400 Bad Request / MissingKeyMapError when no key is configured.
 */

let googleMapsScriptPromise: Promise<boolean> | null = null;

export const loadGoogleMapsScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google && (window as any).google.maps) return Promise.resolve(true);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return Promise.resolve(false);
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve) => {
      // Check if already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Failed to load Google Maps SDK; defaulting to OpenStreetMap fallback.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
};
