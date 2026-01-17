// Minimal, safe typings for optional Google Maps JS API presence.
// These keep TS happy without pulling full @types/google.maps.

export {}; // Ensure this file is a module so global augmentation works

declare global {
	interface Window {
		google?: {
			maps?: unknown; // Minimal; code should guard with optional chaining
		};
		initGoogleMaps?: () => void;
	}
}
