import { Badge, Card } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { CollectorTask } from "@/types/collector";
import { getWasteTypeLabel } from "@/utils/helpers";
import { extractMediaUrl } from "../../utils/media";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TaskCardProps {
  task: CollectorTask;
  onPress?: () => void;
  showTimer?: boolean;
  countdown?: number; // seconds
}

export function TaskCard({ task, onPress, showTimer, countdown }: TaskCardProps) {
  const getStatusBadge = () => {
    switch (task.status) {
      case "PENDING_ACCEPT":
        return <Badge label="Chờ xác nhận" color="warning" size="small" />;
      case "ASSIGNED":
        return <Badge label="Đã nhận" color="success" size="small" />;
      case "ON_THE_WAY":
        return <Badge label="Đang di chuyển" color="info" size="small" />;
      case "ARRIVED":
        return <Badge label="Đã đến" color="secondary" size="small" />;
      default:
        return null;
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card variant="elevated" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          {getStatusBadge()}
          {showTimer && countdown !== undefined && (
            <View style={[styles.timer, countdown < 60 && styles.timerUrgent]}>
              <Ionicons
                name="time"
                size={16}
                color={countdown < 60 ? AppColors.error : AppColors.warning}
              />
              <Text
                style={[styles.timerText, countdown < 60 && styles.timerTextUrgent]}
              >
                {formatCountdown(countdown)}
              </Text>
            </View>
          )}
        </View>

        {/* Image */}
        {task.images && task.images.length > 0 && (
          <Image source={{ uri: extractMediaUrl(task.images[0]) || task.images[0] }} style={styles.image} />
        )}

        {/* Address */}
        <View style={styles.row}>
          <Ionicons name="location" size={18} color={AppColors.primary} />
          <Text style={styles.address} numberOfLines={2}>
            {task.address}
          </Text>
        </View>

        {/* Distance */}
        {task.distanceKm !== undefined && (
          <View style={styles.row}>
            <Ionicons name="navigate" size={18} color={AppColors.gray[600]} />
            <Text style={styles.distance}>{task.distanceKm.toFixed(1)} km</Text>
          </View>
        )}

        {/* Waste info */}
        <View style={styles.wasteInfo}>
          <View style={styles.wasteTypes}>
            {task.wasteTypes.map((type, index) => (
              <Badge
                key={index}
                label={getWasteTypeLabel(type)}
                color="primary"
                size="small"
              />
            ))}
          </View>
          <View style={styles.weight}>
            <Ionicons name="scale" size={16} color={AppColors.gray[600]} />
            <Text style={styles.weightText}>~{task.estimatedWeightKg} kg</Text>
          </View>
        </View>

        {/* Citizen info */}
        <View style={styles.citizenInfo}>
          <Ionicons name="person" size={16} color={AppColors.gray[600]} />
          <Text style={styles.citizenName}>{task.citizenName}</Text>
          <Ionicons
            name="call"
            size={16}
            color={AppColors.primary}
            style={styles.phoneIcon}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerUrgent: {
    backgroundColor: "#FEE2E2",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.warning,
    marginLeft: 4,
  },
  timerTextUrgent: {
    color: AppColors.error,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: AppColors.gray[800],
    marginLeft: 8,
    lineHeight: 20,
  },
  distance: {
    fontSize: 14,
    color: AppColors.gray[600],
    marginLeft: 8,
  },
  wasteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  wasteTypes: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  weight: {
    flexDirection: "row",
    alignItems: "center",
  },
  weightText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[700],
    marginLeft: 4,
  },
  citizenInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  citizenName: {
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 6,
    flex: 1,
  },
  phoneIcon: {
    marginLeft: 8,
  },
});
