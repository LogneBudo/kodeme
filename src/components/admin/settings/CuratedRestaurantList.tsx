import React from "react";

interface CuratedRestaurantListProps {
  curatedList: string;
  setCuratedList: (list: string) => void;
}

const CuratedRestaurantList: React.FC<CuratedRestaurantListProps> = ({
  curatedList,
  setCuratedList,
}) => {
  return (
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
  );
};

export default CuratedRestaurantList;
