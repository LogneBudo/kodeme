// Test script to check Mapillary API response
// Run this in browser console to debug

// Do NOT hardcode real tokens in code or docs. Use env vars.
const MAPILLARY_TOKEN = process.env.VITE_MAPILLARY_TOKEN || '[REMOVED_MAPILLARY_TOKEN]_mapillary_token_here';

// Test coordinates (Athens, Greece - Plaka area)
const testCoords = [37.9738, 23.7275];
const [lat, lon] = testCoords;

// Test different API endpoints
const endpoints = [
  // v4 API with closeto
  `https://graph.mapillary.com/images?fields=id,thumb_2048_url,thumb_1024_url&limit=5&closeto=${lon},${lat}&radius=100&access_token=${MAPILLARY_TOKEN}`,
  
  // v4 API with bbox (bounding box)
  `https://graph.mapillary.com/images?fields=id,thumb_2048_url,thumb_1024_url&limit=5&bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&access_token=${MAPILLARY_TOKEN}`,
  
  // Image search nearby
  `https://graph.mapillary.com/search/im/by_closeto?closeto=${lon},${lat}&radius=1000&limit=1&access_token=${MAPILLARY_TOKEN}`,
];

console.log('🔍 Testing Mapillary API endpoints...\n');

Promise.all(endpoints.map((url, idx) => 
  fetch(url)
    .then(r => r.json())
    .then(json => {
      console.log(`Endpoint ${idx + 1}:`, url.substring(0, 80) + '...');
      console.log('Response:', json);
      console.log('---\n');
      return json;
    })
    .catch(err => console.error(`Endpoint ${idx + 1} error:`, err))
));
