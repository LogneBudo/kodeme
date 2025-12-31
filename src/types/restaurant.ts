export type Restaurant = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  website?: string;
};

export type RestaurantSettings = {
  restaurantCity: string;
  restaurantPerimeterKm: number;
  restaurants: Restaurant[];
};
