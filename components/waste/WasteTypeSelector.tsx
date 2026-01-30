import { AppColors } from "@/constants/theme";
import { WASTE_TYPES } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WasteType } from "@/types";

interface WasteTypeSelectorProps {
  selectedType: WasteType;
  onSelect: (type: WasteType) => void;
}

export default function WasteTypeSelector({
  selectedType,
  onSelect,
}: WasteTypeSelectorProps) {
  const wasteTypes = WASTE_TYPES;
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {wasteTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeButton,
              selectedType === type.value && {
                backgroundColor: type.color,
                borderColor: type.color,
              },
            ]}
            onPress={() => onSelect(type.value as WasteType)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={type.icon as any}
              size={28}
              color={selectedType === type.value ? AppColors.white : type.color}
              style={styles.typeIcon}
            />
            <Text
              style={[
                styles.typeLabel,
                selectedType === type.value && styles.typeLabelActive,
              ]}
              numberOfLines={2}
            >
              {type.label}
            </Text>
            <Text
              style={[
                styles.typePoints,
                selectedType === type.value && styles.typePointsActive,
              ]}
            >
              {type.points}đ/kg
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },
  typeButton: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIcon: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  typeLabelActive: {
    color: AppColors.white,
  },
  typePoints: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  typePointsActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
});
