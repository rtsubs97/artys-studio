export interface EarthLocationPoint {
  name: string;
  lat: number;
  lon: number;
  clientsServed: number;
}

export const EARTH_LOCATION_POINTS: EarthLocationPoint[] = [
  { name: "New York", lat: 40.7128, lon: -74.006, clientsServed: 142 },
  { name: "London", lat: 51.5074, lon: -0.1278, clientsServed: 89 },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243, clientsServed: 215 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, clientsServed: 64 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, clientsServed: 38 },
];
