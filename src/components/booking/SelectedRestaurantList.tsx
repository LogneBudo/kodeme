import React, { useState } from "react";
import type { Restaurant } from "../../types/restaurant";


interface SelectedRestaurantListProps {
  restaurants: Restaurant[];
}


const SelectedRestaurantList: React.FC<SelectedRestaurantListProps> = ({ restaurants }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  if (!restaurants || restaurants.length === 0) {
    return <div className="empty-restaurant-list">No restaurants selected yet.</div>;
  }

  return (
    <ul className="selected-restaurant-list">
      {restaurants.map((restaurant, idx) => (
        <li key={restaurant.name + restaurant.address} className="restaurant-item">
          <div>
            <strong>{restaurant.name}</strong>
            <div>{restaurant.address}</div>
            <button
              style={{
                margin: '8px 0',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: copiedIdx === idx ? '#22c55e' : '#f3f4f6',
                color: copiedIdx === idx ? '#fff' : '#2563eb',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: 13,
                transition: 'background 0.2s, color 0.2s',
              }}
              onClick={() => {
                navigator.clipboard.writeText(`${restaurant.lat},${restaurant.lng}`);
                setCopiedIdx(idx);
                setTimeout(() => setCopiedIdx(null), 1500);
              }}
              title="Copy geo coordinates to clipboard"
            >
              {copiedIdx === idx ? 'Copied!' : 'Copy geo coordinates'}
            </button>
            {restaurant.website && (
              <div>
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer">Website</a>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SelectedRestaurantList;
