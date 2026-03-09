import { Button, Card } from "@/components/common";
import { StatusBadge } from "@/components/collector";
import { AppColors } from "@/constants/theme";
import { CollectorStatus } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "@/components/common/MockMapView";

export default function ShiftControlScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<CollectorStatus>("AVAILABLE");
  const [location, setLocation] = useState({
    latitude: 10.7769,
    longitude: 106.7009,
  });
  const [isInZone, setIsInZone] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // TODO: Request GPS permission
    checkGPSPermission();
  }, []);

  const checkGPSPermission = async () => {
    // Mock - thay bằng expo-location
    setPermissionGranted(true);
  };

  const handleStartShift = () => {
    if (!permissionGranted) {
      Alert.alert("Lỗi", "Bạn cần cấp quyền GPS để bắt đầu ca làm");
      return;
    }

    Alert.alert("Thành công", "Đã bắt đầu ca làm việc. Bạn sẽ nhận nhiệm vụ mới!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  const getGeofenceMessage = () => {
    if (isInZone) {
      return {
        icon: "checkmark-circle",
        color: AppColors.success,
        text: "✅ Bạn đang trong khu vực làm việc",
      };
    } else {
      return {
        icon: "warning",
        color: AppColors.warning,
        text: "⚠️ Bạn đang ngoài khu vực chính. Hệ thống vẫn cho phép nhưng ưu tiên sẽ thấp hơn.",
      };
    }
  };

  const geofenceInfo = getGeofenceMessage();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Zone boundary */}
            <Circle
              center={location}
              radius={1000} // 1km
              fillColor="rgba(76, 175, 80, 0.2)"
              strokeColor={AppColors.primary}
              strokeWidth={2}
            />
            {/* Collector location */}
            <Marker coordinate={location}>
              <View style={styles.markerContainer}>
                <Ionicons name="person" size={24} color={AppColors.white} />
              </View>
            </Marker>
          </MapView>
        </View>

        {/* Control Panel */}
        <View style={styles.content}>
          {/* Geofence warning */}
          <Card
            variant="outlined"
            style={[
              styles.geofenceCard,
              { borderColor: geofenceInfo.color, backgroundColor: geofenceInfo.color + "10" },
            ]}
          >
            <View style={styles.geofenceContent}>
              <Ionicons name={geofenceInfo.icon as any} size={28} color={geofenceInfo.color} />
              <Text style={[styles.geofenceText, { color: geofenceInfo.color }]}>
                {geofenceInfo.text}
              </Text>
            </View>
          </Card>

          {/* Status selector */}
          <Card variant="elevated" style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Trạng thái</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === "AVAILABLE" && styles.statusOptionActive,
                ]}
                onPress={() => setStatus("AVAILABLE")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
                <Text
                  style={[
                    styles.statusOptionText,
                    status === "AVAILABLE" && styles.statusOptionTextActive,
                  ]}
                >
                  Sẵn sàng nhận đơn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, status === "OFFLINE" && styles.statusOptionActive]}
                onPress={() => setStatus("OFFLINE")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#EF4444" }]} />
                <Text
                  style={[
                    styles.statusOptionText,
                    status === "OFFLINE" && styles.statusOptionTextActive,
                  ]}
                >
                  Ngoại tuyến
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* GPS info */}
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name={permissionGranted ? "location" : "location-outline"}
                size={20}
                color={permissionGranted ? AppColors.success : AppColors.error}
              />
              <Text style={styles.infoText}>
                GPS: {permissionGranted ? "Đã kích hoạt" : "Chưa cấp quyền"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={AppColors.primary} />
              <Text style={styles.infoText}>
                Vị trí: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color={AppColors.gray[600]} />
              <Text style={styles.infoText}>Khu vực: Quận 1 – Phường Bến Nghé</Text>
            </View>
          </Card>

          {/* Warning */}
          <Card variant="outlined" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="information-circle" size={24} color={AppColors.info} />
              <Text style={styles.warningTitle}>Lưu ý</Text>
            </View>
            <Text style={styles.warningText}>
              • GPS bắt buộc phải được bật khi bắt đầu ca làm{"\n"}
              • Vị trí của bạn sẽ được theo dõi real-time{"\n"}
              • Bạn sẽ nhận thông báo khi có nhiệm vụ mới
            </Text>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Xác nhận bắt đầu"
              onPress={handleStartShift}
              disabled={!permissionGranted}
            />
            <Button title="Huỷ" variant="outline" onPress={() => router.back()} />
          </View>
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
    height: 300,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  content: {
    padding: 20,
  },
  geofenceCard: {
    marginBottom: 20,
    borderWidth: 2,
  },
  geofenceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  geofenceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    lineHeight: 20,
  },
  statusCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    backgroundColor: AppColors.white,
  },
  statusOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 15,
    color: AppColors.gray[700],
    fontWeight: "500",
  },
  statusOptionTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  infoCard: {
    marginBottom: 20,
    backgroundColor: AppColors.gray[50],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 12,
  },
  warningCard: {
    marginBottom: 24,
    backgroundColor: AppColors.info + "10",
    borderColor: AppColors.info,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.gray[800],
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
});
