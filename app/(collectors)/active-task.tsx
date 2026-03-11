import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { collectorService } from "@/services/collector.service";
import { CollectorTaskItem } from "@/types/collector";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type ActivePhase = "ACCEPTED" | "ON_THE_WAY" | "ARRIVED" | "COMPLETED";

const getRoutingMapHtml = (userLat: number, userLng: number, targetLat: number, targetLng: number) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #f0f0f0; }
          .custom-div-icon { background: transparent; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
          });
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
          }).addTo(map);

          var userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#4CAF50;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          var targetIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#F44336;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          L.marker([${userLat}, ${userLng}], {icon: userIcon}).addTo(map);
          L.marker([${targetLat}, ${targetLng}], {icon: targetIcon}).addTo(map);
          
          var bounds = L.latLngBounds([
              [${userLat}, ${userLng}],
              [${targetLat}, ${targetLng}]
          ]);
          map.fitBounds(bounds, {padding: [40, 40]});

          var latlngs = [
              [${userLat}, ${userLng}],
              [${targetLat}, ${targetLng}]
          ];
          var polyline = L.polyline(latlngs, {color: '#2196F3', weight: 4, dashArray: '8, 8'}).addTo(map);
        </script>
      </body>
    </html>
`;

export default function ActiveTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<CollectorTaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [phase, setPhase] = useState<ActivePhase>("ACCEPTED");
  const phaseRef = useRef<ActivePhase>("ACCEPTED");

  // Keep ref in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  // Fetch task data
  const fetchTask = useCallback(async () => {
    try {
      let data: CollectorTaskItem | null = null;
      if (!id || id === "NaN" || id === "undefined") {
        const acceptedTasks = await collectorService.getAcceptedTasks();
        if (acceptedTasks && acceptedTasks.length > 0) {
          data = acceptedTasks[0];
        }
      } else {
        data = await collectorService.getTaskById(Number(id));
      }

      if (!data) {
        setLoading(false);
        return;
      }

      setTask(data);
      // Determine phase from task status
      const currentStatus = data.status === "ON_THE_WAY" || data.report?.status === "ON_THE_WAY"
        ? "ON_THE_WAY"
        : data.status;

      console.log(`[active-task] Task fetched, evaluated status: ${currentStatus} (Task: ${data.status}, Report: ${data.report?.status})`);
      if (currentStatus === "ARRIVED" || currentStatus === "COLLECTING") {
        setPhase("ARRIVED");
        console.log(`[active-task] Phase set to ARRIVED`);
      } else if (currentStatus === "COMPLETED") {
        setPhase("COMPLETED");
        console.log(`[active-task] Phase set to COMPLETED`);
      } else if (currentStatus === "ON_THE_WAY") {
        setPhase("ON_THE_WAY");
        console.log(`[active-task] Phase set to ON_THE_WAY`);
      } else {
        setPhase("ACCEPTED");
        console.log(`[active-task] Phase set to ACCEPTED`);
      }
    } catch (error) {
      console.error("Error fetching active task:", error);
      showToast("Không tải được thông tin đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Get current location  
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Cần quyền truy cập vị trí", "error");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      return loc.coords;
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Send location to server (HTTP Polling)
  const sendLocationUpdate = async () => {
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        await collectorService.updateLocation(coords.latitude, coords.longitude);
        console.log("📍 Location updated:", coords.latitude.toFixed(5), coords.longitude.toFixed(5));
      }
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  // Start polling
  useEffect(() => {
    fetchTask();
    getCurrentLocation();

    // Start HTTP Polling every 50 seconds
    pollingRef.current = setInterval(() => {
      // Use phaseRef.current because setInterval closure captures the initial state
      if (phaseRef.current === "ON_THE_WAY") {
        sendLocationUpdate();
      }
    }, 50000);

    // Initial send
    sendLocationUpdate();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Handle status changes
  const handleUpdateStatus = async (newStatus: string, statusLabel: string) => {
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn chuyển sang trạng thái "${statusLabel}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              console.log(`[active-task] Calling updateTaskStatus to state: ${newStatus}`);
              setUpdating(true);
              let res: { success: boolean; message?: string };
              if (newStatus === "ON_THE_WAY") {
                res = await collectorService.startMoving(task!.reportId);
              } else {
                res = await collectorService.updateTaskStatus(task!.id, newStatus);
              }
              console.log(`[active-task] update status response:`, res);
              if (res.success) {
                showToast(`Đã chuyển sang: ${statusLabel}`, "success");
                if (newStatus === "ARRIVED") {
                  setPhase("ARRIVED");
                } else if (newStatus === "ON_THE_WAY") {
                  setPhase("ON_THE_WAY");
                } else if (newStatus === "COMPLETED") {
                  setPhase("COMPLETED");
                  // Stop polling
                  if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                  }
                  setTimeout(() => {
                    router.replace("/(collectors)" as any);
                  }, 2000);
                }
                // Refresh task data
                fetchTask();
              } else {
                showToast(res.message || "Không thể cập nhật trạng thái", "error");
              }
            } catch (error) {
              console.error(`[active-task] Error in updateTaskStatus:`, error);
              showToast("Đã có lỗi xảy ra", "error");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (lat: number, lon: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={AppColors.gray[400]} />
        <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
        <Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const report = task.report;
  const citizen = report.citizen;

  const getPhaseInfo = () => {
    switch (phase) {
      case "ACCEPTED":
        return { icon: "document-text" as const, color: AppColors.secondary, label: "Đã nhận đơn", bg: AppColors.secondary + "15" };
      case "ON_THE_WAY":
        return { icon: "car" as const, color: AppColors.info, label: "Đang di chuyển đến", bg: AppColors.info + "15" };
      case "ARRIVED":
        return { icon: "location" as const, color: AppColors.primary, label: "Đã đến nơi", bg: AppColors.primary + "15" };
      case "COMPLETED":
        return { icon: "checkmark-done-circle" as const, color: AppColors.success, label: "Hoàn thành", bg: AppColors.success + "15" };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: phaseInfo.bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={AppColors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.statusBannerContent}>
          <Ionicons name={phaseInfo.icon} size={24} color={phaseInfo.color} />
          <Text style={[styles.statusBannerText, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map Area - Hiển thị thông tin vị trí */}
        {phase === "ON_THE_WAY" && (
          <Card variant="elevated" style={styles.mapCard}>
            <View style={styles.mapContainer}>
              {currentLocation && report ? (
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: getRoutingMapHtml(currentLocation.latitude, currentLocation.longitude, report.latitude, report.longitude) }}
                  style={styles.webView}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator color={AppColors.primary} />
                  <Text style={styles.mapSubtext}>Đang tải bản đồ...</Text>
                </View>
              )}
            </View>

            {/* Location info */}
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: AppColors.primary }]} />
                <Text style={styles.routeLabel}>Vị trí của bạn</Text>
                <Text style={styles.routeCoords}>
                  {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : "Đang lấy..."}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: AppColors.error }]} />
                <Text style={styles.routeLabel}>Điểm thu gom</Text>
                <Text style={styles.routeCoords}>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.openMapBtn}
              onPress={() => handleOpenMap(report.latitude, report.longitude, report.address)}
            >
              <Ionicons name="navigate" size={20} color={AppColors.white} />
              <Text style={styles.openMapText}>Mở Google Maps chỉ đường</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Order Info */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
          <InfoRow icon="document-text" label="Mã đơn" value={`#${task.reportId}`} />
          <InfoRow icon="location" label="Địa chỉ" value={report.address} />
          <InfoRow icon="chatbox" label="Mô tả" value={report.description || "Không có mô tả"} />
        </Card>

        {/* Waste Items */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Phân loại rác</Text>
          {report.wasteItems.map((item, idx) => (
            <View key={idx} style={styles.wasteItemRow}>
              <View style={styles.wasteItemTag}>
                <Text style={styles.wasteItemType}>{getWasteTypeLabel(item.wasteType)}</Text>
              </View>
              <Text style={styles.wasteItemWeight}>{item.weightKg.toFixed(1)} kg</Text>
            </View>
          ))}
        </Card>

        {/* Images */}
        {report.images && report.images.length > 0 && (
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Hình ảnh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesRow}>
                {report.images.map((img) => (
                  <Image key={img.id} source={{ uri: img.imageUrl }} style={styles.reportImage} />
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Customer Info */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              {citizen.avatar ? (
                <Image source={{ uri: citizen.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={24} color={AppColors.white} />
              )}
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{citizen.fullName}</Text>
              <Text style={styles.customerPhone}>{citizen.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(citizen.phone)}>
              <Ionicons name="call" size={20} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {phase === "ACCEPTED" && (
            <TouchableOpacity
              style={[styles.primaryAction, { backgroundColor: AppColors.info }]}
              onPress={() => handleUpdateStatus("ON_THE_WAY", "Đang di chuyển")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <>
                  <Ionicons name="car" size={22} color={AppColors.white} />
                  <Text style={styles.primaryActionText}>Bắt đầu di chuyển</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {phase === "ON_THE_WAY" && (
            <>
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: AppColors.primary }]}
                onPress={() => handleUpdateStatus("ARRIVED", "Đã đến nơi")}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <>
                    <Ionicons name="location" size={22} color={AppColors.white} />
                    <Text style={styles.primaryActionText}>Xác nhận đã đến nơi</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.pollingNote}>
                📡 Vị trí đang được cập nhật mỗi 50 giây
              </Text>
            </>
          )}

          {phase === "ARRIVED" && (
            <>
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: AppColors.success }]}
                onPress={() => handleUpdateStatus("COMPLETED", "Hoàn thành đơn")}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={22} color={AppColors.white} />
                    <Text style={styles.primaryActionText}>Hoàn thành đơn</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push(`/(collectors)/task-absent?id=${task.id}` as any)}
                >
                  <Ionicons name="person-remove" size={18} color={AppColors.warning} />
                  <Text style={[styles.secondaryBtnText, { color: AppColors.warning }]}>Báo vắng khách</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push(`/(collectors)/task-report-issue?id=${task.id}` as any)}
                >
                  <Ionicons name="warning" size={18} color={AppColors.error} />
                  <Text style={[styles.secondaryBtnText, { color: AppColors.error }]}>Báo cáo sự cố</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {phase === "COMPLETED" && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-done-circle" size={48} color={AppColors.success} />
              <Text style={styles.completedText}>Đơn hàng đã hoàn thành!</Text>
              <Text style={styles.completedSubtext}>Đang chuyển về trang chủ...</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={AppColors.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.gray[500],
  },
  errorText: {
    fontSize: 15,
    color: AppColors.gray[500],
    marginTop: 12,
  },
  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  statusBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBannerText: {
    fontSize: 17,
    fontWeight: "700",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  // Map
  mapCard: {
    marginBottom: 16,
    overflow: "hidden",
    padding: 0, // override card padding to let map span full width
  },
  mapContainer: {
    height: 250,
    width: "100%",
    backgroundColor: AppColors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[700],
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 4,
  },
  routeInfo: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[700],
    flex: 1,
  },
  routeCoords: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: AppColors.gray[300],
    marginLeft: 6,
  },
  openMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  openMapText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.white,
  },
  // Cards
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[800],
    lineHeight: 20,
  },
  // Waste items
  wasteItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  wasteItemTag: {
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  wasteItemType: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  wasteItemWeight: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  // Images
  imagesRow: {
    flexDirection: "row",
    gap: 10,
  },
  reportImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  // Customer
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  customerPhone: {
    fontSize: 14,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  // Actions
  actionSection: {
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.white,
  },
  pollingNote: {
    fontSize: 13,
    color: AppColors.gray[500],
    textAlign: "center",
    marginTop: 12,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.gray[200],
    backgroundColor: AppColors.white,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  completedBanner: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  completedText: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.success,
  },
  completedSubtext: {
    fontSize: 14,
    color: AppColors.gray[500],
  },
});
