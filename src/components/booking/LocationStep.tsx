import { useEffect, useRef, useState } from "react";
import zoomImg from "../../assets/locations/zoom.jpg";
import premisesImg from "../../assets/locations/premises.jpg";
import restaurantImg from "../../assets/locations/restaurant.jpg";
import otherImg from "../../assets/locations/other.jpg";
import {
  MapPin,
  Video,
  Building,
  UtensilsCrossed,
  MapPinned,
  ArrowLeft,
  ArrowRight,
  Loader,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Appointment } from "../../types/appointment";
import type { LucideIcon } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import "leaflet/dist/leaflet.css";

// Fix for default leaflet marker icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type LocationType = Appointment["locationDetails"]["type"];


type LocationStepProps = {
  selectedLocation: LocationType;
  setSelectedLocation: (loc: LocationType) => void;
  locationDetails: string;
  setLocationDetails: (value: string) => void;
  restaurants: Restaurant[];
  restaurantsLoading?: boolean;
  onNext: () => void;
  onBack: () => void;
};

type LocationOption = {
  id: LocationType;
  label: string;
  icon: LucideIcon;
  description: string;
  image: string;
};

const locations: LocationOption[] = [
  { id: "zoom", label: "Video Meeting", icon: Video, description: "Online Teams or Zoom video call", image: zoomImg },
  { id: "your_premises", label: "Your Premises", icon: Building, description: "At your office/location", image: premisesImg },
  { id: "restaurant", label: "At a Restaurant", icon: UtensilsCrossed, description: "Meet at a restaurant", image: restaurantImg },
  { id: "other", label: "Other Location", icon: MapPinned, description: "Specify custom location", image: otherImg },
];

export default function LocationStep({
  selectedLocation,
  setSelectedLocation,
  locationDetails,
  setLocationDetails,
  restaurants,
  restaurantsLoading,
  onNext,
  onBack,
}: LocationStepProps) {
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [satelliteView, setSatelliteView] = useState(false);
  const restaurantSectionRef = useRef<HTMLDivElement | null>(null);

  const hasRestaurants = (restaurants || []).length > 0;

  const formatRestaurant = (r: Restaurant) => {
    const trimmedAddress = r.address?.trim();
    return trimmedAddress ? `${r.name} — ${trimmedAddress}` : r.name;
  };

  useEffect(() => {
    if (selectedLocation === "restaurant" && restaurantSectionRef.current) {
      restaurantSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedLocation]);

  // Geocode address to coordinates using Nominatim (free OpenStreetMap service)
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setCoords(null);
      return;
    }

    // Check if it looks like coordinates (number,number format)
    const coordMatch = address.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        setCoords([lat, lon]);
        return;
      }
    }

    // Try to geocode the address
    try {
      setIsGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        setCoords(null);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setCoords(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle show map button click
  const handleShowMap = async () => {
    if (!locationDetails.trim()) {
      setError("Please enter a location first");
      return;
    }
    await geocodeAddress(locationDetails);
    setShowMap(true);
  };

  const handleNext = () => {
    if (!selectedLocation) {
      setError("Please select a location");
      return;
    }
    if (selectedLocation === "restaurant") {
      if (!locationDetails.trim()) {
        setError(hasRestaurants ? "Please choose a restaurant" : "No restaurants available. Please choose another location type");
        return;
      }
    }
    if ((selectedLocation === "other" || selectedLocation === "your_premises") && !locationDetails.trim()) {
      setError("Please specify the location details (address or geo coordinates)");
      return;
    }
    setError("");
    onNext();
  };

  const cardBase: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    background: "white",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const buttonPrimary: React.CSSProperties = {
    width: "100%",
    height: "56px",
    fontSize: "18px",
    borderRadius: "12px",
    background: "#0f172a",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  const buttonGhost: React.CSSProperties = {
    width: "100%",
    height: "48px",
    fontSize: "16px",
    borderRadius: "10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: "clamp(20px, 5vw, 32px)" }}>
        <div
          style={{
            width: "clamp(48px, 12vw, 64px)",
            height: "clamp(48px, 12vw, 64px)",
            background: "#f1f5f9",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto clamp(16px, 4vw, 24px)",
          }}
        >
          <MapPin size={32} color="#475569" />
        </div>

        <h2
          style={{
            fontSize: "clamp(20px, 5vw, 24px)",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "8px",
            margin: "0 0 8px 0",
          }}
        >
          Where should we meet?
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Choose your preferred meeting location</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {locations.map((loc) => {
          const Icon = loc.icon;
          const isSelected = selectedLocation === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => {
                setSelectedLocation(loc.id);
                if (loc.id === "restaurant") {
                  setShowMap(false);
                  if (selectedLocation !== "restaurant") setLocationDetails("");
                } else if (selectedLocation === "restaurant") {
                  setLocationDetails("");
                }
                if (error) setError("");
              }}
              style={{
                ...cardBase,
                padding: "clamp(12px, 3vw, 16px)",
                borderColor: isSelected ? "#0f172a" : "#e2e8f0",
                background: isSelected ? "#0f172a" : "white",
                color: isSelected ? "white" : "#0f172a",
                boxShadow: isSelected ? "0 0 0 3px #0f172a33" : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                background: isSelected ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.7)",
                borderRadius: "12px",
                padding: "8px 0",
              }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  }}
                >
                  <Icon size={20} color={isSelected ? "white" : "#475569"} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "clamp(13px, 3vw, 16px)",
                      fontWeight: 600,
                      color: isSelected ? "white" : "#0f172a",
                      margin: "0 0 2px 0",
                      textShadow: isSelected ? "0 1px 4px #0f172a99" : undefined,
                    }}
                  >
                    {loc.label}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: isSelected ? "rgba(255,255,255,0.7)" : "#64748b",
                      margin: 0,
                      textShadow: isSelected ? "0 1px 4px #0f172a99" : undefined,
                    }}
                  >
                    {loc.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedLocation === "restaurant" && (
        <div ref={restaurantSectionRef} style={{ marginBottom: "24px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <UtensilsCrossed size={16} color="#0f172a" />
            <span style={{ fontWeight: 600, color: "#0f172a" }}>Choose a restaurant</span>
          </div>
          {restaurantsLoading ? (
            <div style={{ fontSize: "14px", color: "#64748b" }}>Loading restaurants...</div>
          ) : hasRestaurants ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {restaurants.map((r, idx) => {
                const value = formatRestaurant(r);
                const isChosen = locationDetails === value;
                return (
                  <label
                    key={`${r.name}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: isChosen ? "2px solid #0f172a" : "1px solid #e2e8f0",
                      background: isChosen ? "#0f172a08" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="restaurant-choice"
                      checked={isChosen}
                      onChange={() => {
                        setLocationDetails(value);
                        if (error) setError("");
                      }}
                      style={{ marginTop: "4px" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "15px", color: "#0f172a" }}>{r.name}</span>
                      {r.address && <span style={{ fontSize: "13px", color: "#475569" }}>{r.address}</span>}
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#0ea5e9" }}>
                          Visit website
                        </a>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: "14px", color: "#64748b" }}>No restaurants available. Please choose another location type.</div>
          )}
        </div>
      )}

      {(selectedLocation === "other" || selectedLocation === "your_premises") && (
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>
            {selectedLocation === "your_premises" ? "Location Details" : "Location Details"}
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <textarea
                placeholder="Enter address or geo coordinates"
                value={locationDetails}
                onChange={(e) => {
                  setLocationDetails(e.target.value);
                  if (error) setError("");
                  setShowMap(false);
                }}
                style={{
                  flex: 1,
                  minHeight: "80px",
                  fontSize: "16px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleShowMap}
                disabled={isGeocoding || !locationDetails.trim()}
                style={{
                  background: isGeocoding ? "#cbd5e1" : "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isGeocoding || !locationDetails.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  opacity: isGeocoding || !locationDetails.trim() ? 0.6 : 1,
                  minHeight: "48px",
                  justifyContent: "center",
                }}
              >
                {isGeocoding ? <Loader size={14} className="animate-spin" /> : <MapPin size={14} />}
                {isGeocoding ? "Loading..." : "View Map"}
              </button>
            </div>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
            {selectedLocation === "your_premises" ? "Enter your business address or GPS coordinates" : "e.g., 123 Main St, City or 40.7128,-74.0060"}
          </p>
        </div>
      )}

      {showMap && coords && (
        <div style={{ marginBottom: "20px", borderRadius: "12px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: "8px", padding: "12px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setSatelliteView(false)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: !satelliteView ? "#0f172a" : "#e2e8f0",
                color: !satelliteView ? "white" : "#0f172a",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Map
            </button>
            <button
              onClick={() => setSatelliteView(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: satelliteView ? "#0f172a" : "#e2e8f0",
                color: satelliteView ? "white" : "#0f172a",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Satellite
            </button>
            <button
              onClick={() => setShowMap(false)}
              style={{
                marginLeft: "auto",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: "#e2e8f0",
                color: "#0f172a",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
          <div style={{ height: "300px" }}>
            <MapContainer
              center={coords}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={satelliteView ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              />
              <Marker position={coords}>
                <Popup>{locationDetails}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", marginBottom: "16px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button onClick={handleNext} style={buttonPrimary}>
          Continue
          <ArrowRight size={20} />
        </button>

        <button onClick={onBack} style={buttonGhost}>
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    </div>
  );
}
