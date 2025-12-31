import React from "react";
import SelectedRestaurantList from "../../booking/SelectedRestaurantList";
import type { Restaurant } from "../../../types/restaurant";


interface SelectedRestaurantListPanelProps {
  restaurants: Restaurant[];
}

const SelectedRestaurantListPanel: React.FC<SelectedRestaurantListPanelProps> = ({ restaurants }) => {
  return (
    <div style={{ marginTop: 32, background: '#f1f5f9', borderRadius: 8, padding: 16, minHeight: 80 }}>
      <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Selected Restaurants</h4>
      <SelectedRestaurantList restaurants={restaurants} />
    </div>
  );
};

export default SelectedRestaurantListPanel;
