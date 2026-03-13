import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { collectorService } from "@/services/collector.service";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TaskCheckinScreen() {
  const { id, lat: destLat, lon: destLon } = useLocalSearchParams<{
    id: string;
    lat?: string;
    lon?: string;
  }>();
  const router = useRouter();

  const destinationLocation = {
    latitude: destLat ? parseFloat(destLat) : 10.7769,
    longitude: destLon ? parseFloat(destLon) : 106.7009,
  };

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const ALLOWED_RADIUS = 300; // 300m

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  // Haversine formula to calculate distance between two GPS coordinates
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showToast("Cần quyền truy cập vị trí để check-in", "error");
          setLoadingLoc(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentLocation(coords);

        const dist = getDistanceMeters(
          coords.latitude,
          coords.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude,
        );
        setDistance(Math.round(dist));
      } catch (error) {
        console.error("Error getting location:", error);
        showToast("Không thể lấy vị trí hiện tại", "error");
      } finally {
        setLoadingLoc(false);
      }
    })();
  }, []);

  const canCheckin = distance !== null && distance <= ALLOWED_RADIUS;

  const handleCheckin = async () => {
    if (!canCheckin || !currentLocation) return;

    try {
      setChecking(true);
      const res = await collectorService.checkinArrived(
        Number(id),
        currentLocation.latitude,
        currentLocation.longitude,
      );
      if (res.success) {
        showToast("✅ Đã check-in thành công!", "success");
        setTimeout(() => router.back(), 1500);
      } else {
        showToast("Không thể check-in. Hãy thử lại.", "error");
      }
    } catch (error) {
      showToast("Đã có lỗi xảy ra", "error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color={AppColors.primary} />
          <Text style={styles.mapText}>Vị trí Check-in</Text>
          <Text style={styles.mapSubtext}>(Cần custom dev client để xem map thật)</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.content}>
        {loadingLoc ? (
          <Card variant="elevated" style={styles.statusCard}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={styles.loadingText}>Đang lấy vị trí GPS...</Text>
            </View>
          </Card>
        ) : (
          <Card
            variant="elevated"
            style={[
              styles.statusCard,
              { borderColor: canCheckin ? AppColors.success : AppColors.error },
            ]}
          >
            <View style={styles.distanceInfo}>
              <Ionicons
                name={canCheckin ? "checkmark-circle" : "close-circle"}
                size={48}
                color={canCheckin ? AppColors.success : AppColors.error}
              />
              <View style={styles.distanceText}>
                <Text style={styles.distanceLabel}>Khoảng cách đến điểm thu gom</Text>
                <Text
                  style={[
                    styles.distanceValue,
                    { color: canCheckin ? AppColors.success : AppColors.error },
                  ]}
                >
                  {distance !== null ? `${distance} mét` : "Không xác định"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBanner,
                { backgroundColor: canCheckin ? AppColors.success + "10" : AppColors.error + "10" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: canCheckin ? AppColors.success : AppColors.error },
                ]}
              >
                {canCheckin
                  ? "✅ Trong bán kính cho phép — có thể check-in"
                  : `❌ Còn cách ${distance}m, vui lòng đến gần hơn`}
              </Text>
            </View>
          </Card>
        )}

        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={AppColors.info} />
            <Text style={styles.infoText}>
              Bạn cần ở trong bán kính {ALLOWED_RADIUS}m từ điểm thu gom để check-in
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={AppColors.warning} />
            <Text style={styles.infoText}>
              Sau khi check-in, bạn có 20 phút để chờ Công dân
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Xác nhận đã đến"
            onPress={handleCheckin}
            disabled={!canCheckin || checking}
            loading={checking}
          />
          <Button
            title="Hủy"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  mapContainer: {
    height: 280,
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: AppColors.gray[200],
  },
  mapText: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.gray[600],
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 16,
    borderWidth: 3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 15,
    color: AppColors.gray[600],
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  distanceText: {
    flex: 1,
    marginLeft: 16,
  },
  distanceLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  statusBanner: {
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: AppColors.info + "10",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
