import { Button, Card } from "@/components/common";
import { TaskStepper } from "@/components/collector";
import { AppColors } from "@/constants/theme";
import { CollectorTask } from "@/types/collector";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "@/components/common/MockMapView";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock data - thay bằng API call
  const [task, setTask] = useState<CollectorTask>({
    id: id as string,
    reportId: "R001",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    latitude: 10.7769,
    longitude: 106.7009,
    distanceKm: 1.2,
    wasteTypes: ["ORGANIC", "RECYCLABLE"],
    estimatedWeightKg: 15,
    description: "Rác hữu cơ từ nhà bếp và chai nhựa đã phân loại",
    images: [],
    citizenId: "C001",
    citizenName: "Nguyễn Văn A",
    citizenPhone: "0901234567",
    status: "ASSIGNED",
    createdAt: new Date().toISOString(),
    assignedAt: new Date().toISOString(),
    citizenConfirmedPresence: false,
  });

  const collectorLocation = { latitude: 10.7709, longitude: 106.6969 };

  const handleCall = () => {
    Linking.openURL(`tel:${task.citizenPhone}`);
  };

  const handleStartMoving = () => {
    Alert.alert("Xác nhận", "Bắt đầu di chuyển đến điểm thu gom?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Bắt đầu",
        onPress: () => {
          setTask({ ...task, status: "ON_THE_WAY" });
          Alert.alert("Thành công", "Đã bắt đầu di chuyển. Hãy đến địa chỉ thu gom!");
        },
      },
    ]);
  };

  const handleCheckin = () => {
    router.push(`/(collectors)/task-checkin?id=${task.id}` as any);
  };

  const handleComplete = () => {
    router.push(`/(collectors)/task-complete?id=${task.id}` as any);
  };

  const handleReportAbsent = () => {
    router.push(`/(collectors)/task-absent?id=${task.id}` as any);
  };

  const handleReportIssue = () => {
    router.push(`/(collectors)/task-report-issue?id=${task.id}` as any);
  };

  const getActionButtons = () => {
    switch (task.status) {
      case "ASSIGNED":
        return (
          <Button title="🚗 Bắt đầu di chuyển" onPress={handleStartMoving} />
        );
      case "ON_THE_WAY":
        return (
          <Button title="📍 Tôi đã đến nơi (Check-in)" onPress={handleCheckin} />
        );
      case "ARRIVED":
        return (
          <View style={styles.multiActions}>
            <Button title="✅ Hoàn tất thu gom" onPress={handleComplete} />
            <Button
              title="⚠️ Báo vắng khách"
              variant="outline"
              onPress={handleReportAbsent}
            />
            <Button
              title="🚨 Báo cáo sự cố"
              variant="outline"
              onPress={handleReportIssue}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stepper */}
        <TaskStepper currentStatus={task.status} />

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (collectorLocation.latitude + task.latitude) / 2,
              longitude: (collectorLocation.longitude + task.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Collector location */}
            <Marker coordinate={collectorLocation} title="Vị trí của bạn">
              <View style={styles.markerCollector}>
                <Ionicons name="person" size={20} color={AppColors.white} />
              </View>
            </Marker>

            {/* Destination */}
            <Marker coordinate={{ latitude: task.latitude, longitude: task.longitude }} title="Điểm thu gom">
              <View style={styles.markerDestination}>
                <Ionicons name="home" size={20} color={AppColors.white} />
              </View>
            </Marker>

            {/* Route line */}
            <Polyline
              coordinates={[collectorLocation, { latitude: task.latitude, longitude: task.longitude }]}
              strokeColor={AppColors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          </MapView>
        </View>

        <View style={styles.content}>
          {/* Task info */}
          <Card variant="elevated" style={styles.infoCard}>
            <Text style={styles.cardTitle}>Thông tin nhiệm vụ</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={AppColors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{task.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={AppColors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Khoảng cách</Text>
                <Text style={styles.infoValue}>{task.distanceKm} km</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="trash" size={20} color={AppColors.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại rác</Text>
                <View style={styles.wasteTypes}>
                  {task.wasteTypes.map((type, index) => (
                    <Text key={index} style={styles.wasteType}>
                      {getWasteTypeLabel(type)}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="scale" size={20} color={AppColors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Khối lượng ước tính</Text>
                <Text style={styles.infoValue}>{task.estimatedWeightKg} kg</Text>
              </View>
            </View>

            {task.description && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text" size={20} color={AppColors.gray[600]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mô tả</Text>
                  <Text style={styles.infoValue}>{task.description}</Text>
                </View>
              </View>
            )}

            {task.images && task.images.length > 0 && (
              <View style={styles.imagesContainer}>
                <Text style={styles.infoLabel}>Hình ảnh</Text>
                <View style={styles.images}>
                  {task.images.slice(0, 3).map((img, idx) => (
                    <Image key={idx} source={{ uri: img }} style={styles.image} />
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Citizen info */}
          <Card variant="elevated" style={styles.citizenCard}>
            <Text style={styles.cardTitle}>Thông tin Công dân</Text>

            <View style={styles.citizenInfo}>
              <View style={styles.citizenAvatar}>
                <Ionicons name="person" size={28} color={AppColors.white} />
              </View>
              <View style={styles.citizenDetails}>
                <Text style={styles.citizenName}>{task.citizenName}</Text>
                <Text style={styles.citizenPhone}>{task.citizenPhone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color={AppColors.white} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Action buttons */}
          <View style={styles.actions}>{getActionButtons()}</View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  mapContainer: {
    height: 250,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerCollector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  markerDestination: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: AppColors.gray[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray[800],
    lineHeight: 20,
  },
  wasteTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wasteType: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
    backgroundColor: AppColors.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imagesContainer: {
    marginTop: 8,
  },
  images: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  citizenCard: {
    marginBottom: 16,
  },
  citizenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  citizenAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  citizenDetails: {
    flex: 1,
    marginLeft: 12,
  },
  citizenName: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  citizenPhone: {
    fontSize: 14,
    color: AppColors.gray[600],
    marginTop: 4,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    gap: 12,
  },
  multiActions: {
    gap: 12,
  },
});
