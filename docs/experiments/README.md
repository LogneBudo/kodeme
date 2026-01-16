# Experiments & Test Files

This folder contains experimental code, test files, and debug guides that were used during development but are not part of the shipping application.

## Contents

- **MAPILLARY_API_TEST.js** - Test script for Mapillary API integration
- **MAPILLARY_DEBUG_GUIDE.md** - Debugging guide for Mapillary features
- **MapillaryTest.tsx** - Test page component (not routed in production)
- **MapillaryTest.module.css** - Styles for MapillaryTest page
- **mapillary-fetch.txt** - Test artifacts for Mapillary fetch operations
- **GOOGLE_MAPS_OPTIONAL_IMPLEMENTATION.md** - Optional Google Maps integration guide
- **FIX_SUMMARY.md** - Historical fix documentation

## Note

These files are preserved for reference but are not included in the production build. The actual Mapillary gallery feature used in the booking flow can be found at:
- `src/components/booking/MapillaryGallery.tsx`
- `src/hooks/useMapillaryImages.ts`
