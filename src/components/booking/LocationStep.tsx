import { useState } from "react";
import {
  MapPin,
  Video,
  Building,
  UtensilsCrossed,
  MapPinned,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { Appointment } from "../../types/appointment";
import type { LucideIcon } from "lucide-react";

type LocationType = Appointment["location_type"];

type LocationStepProps = {
  selectedLocation: LocationType;
  setSelectedLocation: (loc: LocationType) => void;
  locationDetails: string;
  setLocationDetails: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const locations: {
  id: LocationType;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  { id: "zoom", label: "Zoom Meeting", icon: Video, description: "Online video call" },
  { id: "your_premises", label: "Your Premises", icon: Building, description: "At your office/location" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, description: "Meet at a restaurant" },
  { id: "other", label: "Other Location", icon: MapPinned, description: "Specify custom location" },
];

export default function LocationStep({
  selectedLocation,
  setSelectedLocation,
  locationDetails,
  setLocationDetails,
  onNext,
  onBack,
}: LocationStepProps) {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!selectedLocation) {
      setError("Please select a location");
      return;
    }
    if (selectedLocation === "other" && !locationDetails.trim()) {
      setError("Please specify the location");
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
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "#f1f5f9",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <MapPin size={32} color="#475569" />
        </div>

        <h2
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Where should we meet?
        </h2>

        <p style={{ color: "#64748b" }}>Choose your preferred meeting location</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {locations.map((loc) => {
          const Icon = loc.icon;
          const isSelected = selectedLocation === loc.id;

          return (
            <button
              key={loc.id}
              onClick={() => {
                setSelectedLocation(loc.id);
                if (error) setError("");
              }}
              style={{
                ...cardBase,
                borderColor: isSelected ? "#0f172a" : "#e2e8f0",
                background: isSelected ? "#0f172a" : "white",
                color: isSelected ? "white" : "#0f172a",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
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
                      fontSize: "16px",
                      fontWeight: 600,
                      color: isSelected ? "white" : "#0f172a",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {loc.label}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: isSelected ? "rgba(255,255,255,0.7)" : "#64748b",
                      margin: 0,
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

      {selectedLocation === "other" && (
        <div style={{ marginBottom: "24px" }}>
          <input
            placeholder="Enter location details (e.g., address, venue name)"
            value={locationDetails}
            onChange={(e) => {
              setLocationDetails(e.target.value);
              if (error) setError("");
            }}
            style={{
              width: "100%",
              height: "56px",
              fontSize: "18px",
              padding: "0 20px",
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
            }}
          />
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
