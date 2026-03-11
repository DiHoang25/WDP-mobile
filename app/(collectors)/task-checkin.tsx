import { Button, Card } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "@/components/common/MockMapView";

export default function TaskCheckinScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [currentLocation, setCurrentLocation] = useState({
    latitude: 10.7769,
    longitude: 106.7009,
  });

  const destinationLocation = {
    latitude: 10.7769,
    longitude: 106.7009,
  };

  const [distance, setDistance] = useState(50); // meters
  const ALLOWED_RADIUS = 300; // 300m

  const canCheckin = distance <= ALLOWED_RADIUS;

  useEffect(() => {
    // TODO: Get real-time location
    // Calculate distance between current and destination
  }, []);

  const handleCheckin = () => {
    if (!canCheckin) {
      Alert.alert("Lỗi", `Bạn cần đến gần hơn ${ALLOWED_RADIUS}m để check-in`);
      return;
    }

    Alert.alert("Thành công", "Đã check-in thành công! Bây giờ hãy chờ Công dân.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Allowed radius circle */}
          <Circle
            center={destinationLocation}
            radius={ALLOWED_RADIUS}
            fillColor={canCheckin ? "rgba(76, 175, 80, 0.2)" : "rgba(239, 68, 68, 0.2)"}
            strokeColor={canCheckin ? AppColors.success : AppColors.error}
            strokeWidth={2}
          />

          {/* Destination marker */}
          <Marker coordinate={destinationLocation} title="Điểm thu gom">
            <View style={styles.markerDestination}>
              <Ionicons name="home" size={24} color={AppColors.white} />
            </View>
          </Marker>

          {/* Current location marker */}
          <Marker coordinate={currentLocation} title="Vị trí của bạn">
            <View style={styles.markerCurrent}>
              <Ionicons name="person" size={24} color={AppColors.white} />
            </View>
          </Marker>
        </MapView>
      </View>

      {/* Info */}
      <View style={styles.content}>
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
                {distance} mét
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
            disabled={!canCheckin}
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
    height: 400,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerDestination: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  markerCurrent: {
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
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 16,
    borderWidth: 3,
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
