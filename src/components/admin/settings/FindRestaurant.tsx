import React, { useEffect, useState } from "react";
import SelectedRestaurantListPanel from "./SelectedRestaurantListPanel";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 }; // Athens, Greece

const GEOAPIFY_[REMOVED] = import.meta.env.VITE_GEOAPIFY_[REMOVED];
const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN || '';

interface Restaurant {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface GeoapifyFeature {
  properties: {
    name?: string;
    formatted?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

// Fix for default leaflet marker icon (for Vite/CRA)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Helper component to fly to a new location
function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Add helper for Mapillary static image
function getMapillaryImage(lat: number, lng: number): string | null {
  // Mapillary public image API (requires client id, but can use demo images)
  // For demo, use a static image URL pattern (real use requires Mapillary API key)
  // Example: https://images.mapillary.com/<image_key>/thumb-1024.jpg
  // Here, we use a placeholder OSM streetview image
  return `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=480&height=180&center=lonlat:${lng},${lat}&zoom=16&apiKey=${GEOAPIFY_[REMOVED]}`;
}

async function fetchMapillaryImage(lat: number, lng: number): Promise<string | null> {
  if (!MAPILLARY_TOKEN) return null;
  try {
    const url = `https://graph.mapillary.com/images?fields=id,thumb_2048_url,thumb_1024_url&limit=1&closeto=${lng},${lat}&access_token=${MAPILLARY_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();

      return null;
    }
    const json = await res.json();

    const item = json?.data?.[0];
    if (!item) {

      return null;
    }
    const thumb = item?.thumb_2048_url || item?.thumb_1024_url;

    return thumb || null;
  } catch (e) {
    // Mapillary fetch failed silently
    return null;
  }
}

interface FindRestaurantProps {
  city: string;
  selectedRestaurants: Restaurant[];
  setSelectedRestaurants: (list: Restaurant[]) => void;
}

const FindRestaurant: React.FC<FindRestaurantProps> = ({ city, selectedRestaurants, setSelectedRestaurants }) => {
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapillaryImage, setMapillaryImage] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError(null);
    setRestaurants([]);
    async function geocodeAndFetchRestaurants() {
      try {
        let geocodeQuery = city;
        if (city.includes(",")) {
          geocodeQuery = city;
        } else if (city.toLowerCase().includes("athens")) {
          geocodeQuery = "Athens, Greece";
        }
        // Geocode city
        const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeQuery)}&format=json&limit=1`);
        const geoData = await geoResp.json();
        let center = DEFAULT_CENTER;
        if (geoData && geoData.length > 0) {
          center = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
          setCityCenter(center);
        } else {
          setCityCenter(DEFAULT_CENTER);
          setError("Could not find city, showing default location.");
        }
        // Fetch restaurants from Geoapify
        const placesResp = await fetch(
          `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=rect:${center.lng-0.05},${center.lat-0.05},${center.lng+0.05},${center.lat+0.05}&limit=10&apiKey=${GEOAPIFY_[REMOVED]}`
        );
        const placesData = await placesResp.json();
        if (placesData && placesData.features) {
          const results = placesData.features.map((f: GeoapifyFeature) => ({
            name: f.properties.name || "Unnamed Restaurant",
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            address: f.properties.formatted || "",
            website: "",
          }));
          setRestaurants(results);
        } else {
          setRestaurants([]);
        }
      } catch {
        setError("Failed to fetch restaurants.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }
    geocodeAndFetchRestaurants();
  }, [city]);

  useEffect(() => {
    setMapillaryImage(null);
    if (selectedRestaurant) {
      fetchMapillaryImage(selectedRestaurant.lat, selectedRestaurant.lng).then(img => {
        setMapillaryImage(img);
      });
    }
  }, [selectedRestaurant]);

  // Center map on selected restaurant if chosen, else city center
  const mapCenter = selectedRestaurant
    ? { lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }
    : cityCenter || DEFAULT_CENTER;
  const zoom = selectedRestaurant ? 16 : 13;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        Top Restaurants
      </h3>
      {loading && <div>Loading map and restaurants...</div>}
      {error && <div style={{ color: '#e11d48' }}>{error}</div>}
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ width: 520, height: 340, background: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoom}
            style={{ width: 520, height: 340 }}
            scrollWheelZoom={false}
            key={selectedRestaurant ? `${selectedRestaurant.lat},${selectedRestaurant.lng}` : `${mapCenter.lat},${mapCenter.lng}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedRestaurant && (
              <FlyToLocation lat={selectedRestaurant.lat} lng={selectedRestaurant.lng} />
            )}
            {restaurants.map((r, i) => (
              <Marker key={i} position={[r.lat, r.lng]}>
                <Popup>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 14, color: "#555" }}>{r.address}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {/* Images for selected restaurant */}
          {selectedRestaurant && (
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Images</h4>
              {mapillaryImage ? (
                <img src={mapillaryImage} alt="Streetview" style={{ maxWidth: 480, maxHeight: 180, borderRadius: 8, boxShadow: "0 2px 8px #0002" }} />
              ) : (
                <img src={getMapillaryImage(selectedRestaurant.lat, selectedRestaurant.lng) || ''} alt="Static Map" style={{ maxWidth: 480, maxHeight: 180, borderRadius: 8, boxShadow: "0 2px 8px #0002" }} />
              )}
            </div>
          )}
        </div>
        <div style={{ minWidth: 180, height: 340, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", background: "#f8fafc", borderRadius: 8 }}>
          {restaurants.map((r, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', width: '100%' }}>
              <button
                onClick={() => {
                  const exists = selectedRestaurants.some(item => item.name === r.name && item.address === r.address);
                  if (exists) {
                    setSelectedRestaurants(selectedRestaurants.filter(item => !(item.name === r.name && item.address === r.address)));
                  } else {
                    setSelectedRestaurants([...selectedRestaurants, r]);
                  }
                }}
                title={selectedRestaurants.some(item => item.name === r.name && item.address === r.address) ? "Remove from list" : "Add to list"}
                style={{
                  width: 36,
                  minWidth: 36,
                  height: '100%',
                  borderRadius: '8px 0 0 8px',
                  border: 'none',
                  background: selectedRestaurants.some(item => item.name === r.name && item.address === r.address) ? '#16a34a' : '#22c55e',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 20,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px #0002',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  padding: 0,
                  marginRight: 0,
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#16a34a';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = selectedRestaurants.some(item => item.name === r.name && item.address === r.address) ? '#16a34a' : '#22c55e';
                }}
              >
                {selectedRestaurants.some(item => item.name === r.name && item.address === r.address) ? '✔' : '+'}
              </button>
              <button
                onClick={() => {
                  setSelectedRestaurant(r);
                }}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: 8,
                  borderRadius: '0 8px 8px 0',
                  border: selectedRestaurant?.name === r.name ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  background: selectedRestaurant?.name === r.name ? "#eff6ff" : "#f3f4f6",
                  cursor: "pointer",
                  fontWeight: 600,
                  marginBottom: 0,
                  boxShadow: selectedRestaurant?.name === r.name ? "0 4px 16px #2563eb33" : "0 2px 8px #0001",
                  transition: "box-shadow 0.2s, background 0.2s, border 0.2s",
                  fontSize: 14,
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px #2563eb44";
                  (e.currentTarget as HTMLButtonElement).style.background = "#e0e7ff";
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = selectedRestaurant?.name === r.name ? "0 4px 16px #2563eb33" : "0 2px 8px #0001";
                  (e.currentTarget as HTMLButtonElement).style.background = selectedRestaurant?.name === r.name ? "#eff6ff" : "#f3f4f6";
                }}
              >
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "#555" }}>{r.address}</div>
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Google search button for selected restaurant */}
      {selectedRestaurant && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button
            onClick={() => {
              const cityName = city;
              window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedRestaurant.name + ' ' + cityName)}`, '_blank');
            }}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              borderRadius: 8,
              background: '#2563eb',
              color: 'white',
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #2563eb22',
            }}
          >
            Show Google Search for {selectedRestaurant.name}
          </button>
        </div>
      )}
      {/* Selected Restaurant List Panel */}
      <SelectedRestaurantListPanel
        restaurants={selectedRestaurants}
      />
    </div>
  );
};

export default FindRestaurant;
