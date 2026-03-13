import Constants from "expo-constants";

export const config = {
  apiUrl:
    Constants.expoConfig?.extra?.apiUrl || "http://192.168.137.1:8000/api/v1",
  // Optional: Mapbox Directions API key for routing fallback
  mapboxDirectionsKey: Constants.expoConfig?.extra?.mapboxDirectionsKey || "",
};
