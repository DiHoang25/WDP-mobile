import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

// Mock MapView component for Expo Go
export const MapView = ({ children, style, ...props }: any) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <Text style={styles.mapText}>📍 Map View</Text>
      <Text style={styles.mapSubtext}>(Giả lập - cần custom dev client để xem map thật)</Text>
      {children}
    </View>
  );
};

// Mock Marker component
export const Marker = ({ coordinate, title, description }: any) => {
  return (
    <View style={styles.marker}>
      <Text style={styles.markerText}>📍</Text>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
};

// Mock Circle component
export const Circle = ({ center, radius, ...props }: any) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>⭕ {radius}m</Text>
    </View>
  );
};

// Mock Polyline component
export const Polyline = ({ coordinates, ...props }: any) => {
  return (
    <View style={styles.polyline}>
      <Text style={styles.polylineText}>🔵---🔴</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    borderStyle: "dashed",
    overflow: "hidden",
  },
  mapText: {
    fontSize: 24,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: AppColors.gray[600],
    textAlign: "center",
    paddingHorizontal: 20,
  },
  marker: {
    position: "absolute",
    alignItems: "center",
  },
  markerText: {
    fontSize: 32,
  },
  markerTitle: {
    fontSize: 10,
    color: AppColors.gray[700],
    backgroundColor: AppColors.white,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  circle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 14,
    color: AppColors.primary,
  },
  polyline: {
    position: "absolute",
  },
  polylineText: {
    fontSize: 16,
  },
});

// Default export
export default MapView;
