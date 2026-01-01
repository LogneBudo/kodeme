import React from "react";
import FindRestaurant from "./FindRestaurant";
import CuratedRestaurantList from "./CuratedRestaurantList";
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
  restaurants: Restaurant[];
  setRestaurants: (restaurants: Restaurant[]) => void;
  cityValidationLoading: boolean;
  cityValidationError: string | null;
  cityOptions: CityOption[];
  selectedCityIndex: number | null;
  setSelectedCityIndex: (idx: number | null) => void;
  handleValidateCity: () => void;
  country?: string;
}


const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({
  city,
  setCity,
  perimeter,
  setPerimeter,
  curatedList,
  setCuratedList,
  restaurants,
  setRestaurants,
  cityValidationLoading,
  cityValidationError,
  cityOptions,
  selectedCityIndex,
  setSelectedCityIndex,
  handleValidateCity,
  country,
}) => {
  return (
    <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: "22px", fontWeight: 700 }}>Restaurant Settings</h2>

      {/* Section 1: City & perimeter */}
      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px" }}>City & perimeter</span>
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: "15px" }}>City</label>
          {selectedCityIndex !== null && (cityOptions.length > 0 || city) ? (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
              <div style={{ 
                color: "#22c55e", 
                fontWeight: 600, 
                fontSize: "15px",
                padding: "8px 12px",
                backgroundColor: "#f0fdf4",
                borderRadius: "6px",
                border: "1px solid #22c55e"
              }}>
                {(() => {
                  const displayCountry = (cityOptions.length > 0 && selectedCityIndex !== null && selectedCityIndex < cityOptions.length)
                    ? cityOptions[selectedCityIndex].country || country
                    : country;
                  const displayCity = (cityOptions.length > 0 && selectedCityIndex !== null && selectedCityIndex < cityOptions.length)
                    ? cityOptions[selectedCityIndex].displayName
                    : city;
                  return displayCountry && displayCountry.trim() 
                    ? `${displayCity}, ${displayCountry}` 
                    : displayCity;
                })()}
              </div>
              <button
                onClick={() => {
                  setSelectedCityIndex(null);
                  setCity("");
                }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
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
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: 600, fontSize: "15px", minWidth: 120 }}>Perimeter (km)</label>
          <input
            type="number"
            value={perimeter}
            onChange={e => setPerimeter(Number(e.target.value))}
            min={100}
            max={10000}
            step={100}
            style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "15px", width: 140 }}
          />
        </div>
      </div>

      {/* Section 2: Map and restaurant list */}
      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "15px" }}>Map & restaurant list</span>
        </div>
        <FindRestaurant
          city={city}
          selectedRestaurants={restaurants}
          setSelectedRestaurants={setRestaurants}
        />
      </div>

      {/* Section 3: Curated list */}
      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>Curated restaurant list</span>
        <CuratedRestaurantList curatedList={curatedList} setCuratedList={setCuratedList} />
      </div>
    </div>
  );
};

export default RestaurantSettings;
