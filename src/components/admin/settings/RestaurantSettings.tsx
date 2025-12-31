import React, { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../../../api/firebaseApi";
import FindRestaurant from "./FindRestaurant";
import type { Restaurant } from "../../../types/restaurant";

interface CityOption {
  displayName: string;
  lat: number;
  lon: number;
  country: string;
}

interface RestaurantSettingsProps {
  city: string;
  setCity: (city: string) => void;
  perimeter: number;
  setPerimeter: (perimeter: number) => void;
  curatedList: string;
  setCuratedList: (list: string) => void;
  cityValidationLoading: boolean;
  cityValidationError: string | null;
  cityOptions: CityOption[];
  selectedCityIndex: number | null;
  setSelectedCityIndex: (idx: number | null) => void;
  handleValidateCity: () => void;
}


const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({
  city,
  setCity,
  perimeter,
  setPerimeter,
  curatedList,
  setCuratedList,
  cityValidationLoading,
  cityValidationError,
  cityOptions,
  selectedCityIndex,
  setSelectedCityIndex,
  handleValidateCity,
}) => {
  const [showMichelin, setShowMichelin] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Load restaurant list from Firestore on mount
  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.restaurants) setSelectedRestaurants(settings.restaurants);
      if (settings.curatedList !== undefined) setCuratedList(settings.curatedList);
    })();
  }, [setCuratedList]);

  // Save handler: persist to Firestore
  const handleSaveRestaurants = async () => {
    setSaveStatus("Saving...");
    try {
      // Only update the restaurant list and curatedList, keep other settings unchanged
      const settings = await getSettings();
      await updateSettings({ ...settings, restaurants: selectedRestaurants, curatedList });
      setSaveStatus("Saved!");
    } catch {
      setSaveStatus("Error saving");
    }
    setTimeout(() => setSaveStatus(""), 2000);
  };
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px", fontWeight: 700 }}>
        Restaurant Settings
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: 420 }}>
        <div>
          <label style={{ fontWeight: 600, fontSize: "15px" }}>City</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Enter city name"
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "15px", width: 180 }}
            />
            <button
              onClick={handleValidateCity}
              disabled={cityValidationLoading || !city}
              style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: 600, cursor: cityValidationLoading || !city ? "not-allowed" : "pointer", fontSize: "15px" }}
            >
              {cityValidationLoading ? "Validating..." : "Validate"}
            </button>
          </div>
          {cityValidationError && (
            <div style={{ color: "#dc2626", marginTop: "6px", fontSize: "14px" }}>{cityValidationError}</div>
          )}
          {cityOptions.length > 1 && (
            <div style={{ marginTop: "8px" }}>
              <label style={{ fontWeight: 500, fontSize: "14px" }}>Multiple cities found:</label>
              <select
                value={selectedCityIndex ?? ""}
                onChange={e => setSelectedCityIndex(e.target.value ? Number(e.target.value) : null)}
                style={{ marginLeft: "8px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              >
                <option value="">Select city</option>
                {cityOptions.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {opt.displayName} ({opt.country})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: "15px" }}>Perimeter (meters)</label>
          <input
            type="number"
            value={perimeter}
            onChange={e => setPerimeter(Number(e.target.value))}
            min={100}
            max={10000}
            step={100}
            style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "15px", width: 120, marginLeft: "8px" }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: "15px" }}>Curated Restaurant List (comma separated)</label>
          <textarea
            value={curatedList}
            onChange={e => setCuratedList(e.target.value)}
            placeholder="e.g. Sushi Place, Pizza House, Vegan Bistro"
            rows={2}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "15px" }}
          />
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <label style={{ fontWeight: 500, fontSize: 15, marginRight: 12 }}>
          <input
            type="checkbox"
            checked={showMichelin}
            onChange={e => setShowMichelin(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Show only Michelin starred restaurants
        </label>
        <FindRestaurant
          city={city}
          selectedRestaurants={selectedRestaurants}
          setSelectedRestaurants={setSelectedRestaurants}
        />
        <div style={{ marginTop: 18 }}>
          <button
            onClick={handleSaveRestaurants}
            style={{
              background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 12
            }}
            disabled={selectedRestaurants.length === 0}
          >
            Save Restaurant List
          </button>
          {saveStatus && <span style={{ marginLeft: 10, color: saveStatus === 'Saved!' ? '#22c55e' : '#dc2626', fontWeight: 500 }}>{saveStatus}</span>}
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
