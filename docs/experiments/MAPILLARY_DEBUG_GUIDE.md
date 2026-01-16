# Mapillary Image Loading - Debug Guide

## Current Issue
Mapillary images are not loading at addresses. The API may be returning empty results or the token authentication may be failing.

## What's Been Implemented

### 1. **Improved Mapillary Fetch** (LocationStep.tsx, lines 70-110)
- Uses Graph API v4 with bounding box search (more reliable than closeto parameter)
- Searches ~500m radius around the address
- Requests up to 10 images and picks the first one
- Detailed console logging to diagnose issues

### 2. **Enhanced Fallback Chain**
When Mapillary fails:
1. Google Street View (if Google API key available)
2. Google Static Map (if Google API key available)
3. **NEW**: Unsplash location-based search (e.g., "athens restaurant" for Attiki addresses)
4. Static placeholder images

### 3. **Console Debugging Output**
When you enter an address and click "View Map", you'll see:
```
📍 Searching Mapillary images near 37.9738, 23.7275...
🔗 API URL: https://graph.mapillary.com/images?fields=id,thumb_2048_url...
Found 0 images
⚠️  No Mapillary coverage here. Using location-based imagery instead.
📸 Searching Unsplash for location-specific images...
✅ Loaded Unsplash image
```

## Testing Steps

### Option 1: Test Mapillary API Directly
Open browser console and run:
```javascript
const MAPILLARY_TOKEN = '[REMOVED_MAPILLARY_TOKEN]';
const [lat, lon] = [37.9738, 23.7275]; // Athens, Plaka
const radius = 0.005;
const bbox = `${lon-radius},${lat-radius},${lon+radius},${lat+radius}`;
const url = `https://graph.mapillary.com/images?fields=id,thumb_2048_url,thumb_1024_url&limit=10&bbox=${bbox}&access_token=${MAPILLARY_TOKEN}`;

fetch(url)
  .then(r => r.json())
  .then(json => {
    console.log('Response:', json);
    console.log('Image count:', json?.data?.length || 0);
    if (json?.data?.[0]?.thumb_2048_url) {
      console.log('✅ Image URL:', json.data[0].thumb_2048_url);
    }
  });
```

### Option 2: Test via Booking App
1. Go to http://localhost:5173/book
2. Select "Your Premises" or "Other Location"
3. Enter an Athens address (e.g., "Plaka, Athens" or "37.9738, 23.7275")
4. Click "View Map"
5. Check browser console (F12) for debug output

## Possible Issues & Solutions

### 1. **Token Invalid/Permissions**
If you see `API Error 401` or similar:
- Your token might not have Graph API access
- Go to https://www.mapillary.com/developer to regenerate token
- Make sure token starts with `MLY|`

### 2. **No Coverage at Location**
If you see "Found 0 images":
- Mapillary may not have street-level photos at that exact location
- The fallback will use Unsplash location-based search
- This is expected in rural or undocumented areas

### 3. **CORS Error in Console**
If you see CORS errors:
- Mapillary API may require additional request headers
- This is a server-side issue beyond this app's control
- Fallback to Unsplash will work

### 4. **Bounding Box Too Small**
Current: 0.005 degrees (~500m)
If no results, try increasing:
```javascript
const radius = 0.01; // ~1km
```

## What Works Without Google API Key ✅

✅ Address entry and geocoding (Nominatim)
✅ Interactive Leaflet maps (Esri tiles)
✅ Max zoom to address (level 19)
✅ Mapillary image search (if available at location)
✅ Unsplash location-based backgrounds
✅ All location types (Zoom, Your Premises, Other)
✅ Map view with satellite toggle

## What Doesn't Work ❌

❌ Restaurant search (requires Google Places API)
❌ Restaurant photos (requires Google Places API)
❌ Google Street View backgrounds (requires Google API key)
❌ Google Static Map backgrounds (requires Google API key)

## Next Steps to Improve

1. **Verify Token Permissions**
   - Check Mapillary dashboard for API access
   - May need to request Graph API access

2. **Test Alternative Endpoints**
   - Try `closeto` parameter instead of bbox
   - Try different search radius values

3. **Use Mapillary Web API**
   - Less reliable but doesn't require auth
   - Can extract image IDs from public API

4. **Enhance Fallback**
   - Use more location-specific Unsplash queries
   - Add TomTom or HERE Maps as alternatives
