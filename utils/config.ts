import Constants from "expo-constants";

export const config = {
  apiUrl:
    Constants.expoConfig?.extra?.apiUrl || "http://192.168.137.1:8000/api/v1",
};
