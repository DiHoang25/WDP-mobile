import { CollectorStatus } from "@/types/collector";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: CollectorStatus;
  size?: "small" | "large";
}

export function StatusBadge({ status, size = "small" }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        size === "large" && styles.large,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text
        style={[
          styles.text,
          { color: config.textColor },
          size === "large" && styles.largeText,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

function getStatusConfig(status: CollectorStatus) {
  switch (status) {
    case "OFFLINE":
      return {
        label: "Ngoại tuyến",
        bgColor: "#FEE2E2",
        dotColor: "#EF4444",
        textColor: "#991B1B",
      };
    case "AVAILABLE":
    case "ONLINE_AVAILABLE":
      return {
        label: "Sẵn sàng",
        bgColor: "#D1FAE5",
        dotColor: "#10B981",
        textColor: "#065F46",
      };
    case "BUSY":
      return {
        label: "Đang bận",
        bgColor: "#FEF3C7",
        dotColor: "#F59E0B",
        textColor: "#92400E",
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  largeText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
