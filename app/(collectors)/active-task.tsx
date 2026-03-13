import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { collectorService } from "@/services/collector.service";
import { locationService } from "@/services/location.service";
import { CollectorTaskItem } from "@/types/collector";
import { config } from "@/utils/config";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

type ActivePhase = "ACCEPTED" | "ON_THE_WAY" | "ARRIVED" | "COMPLETED";

// Dev-only flag: enable fake GPS route simulation for testing
const USE_FAKE_LOCATION = __DEV__;
// Easy place to tweak fake GPS duration (in minutes)
const FAKE_ROUTE_DURATION_MINUTES = 2;

const getRoutingMapHtml = (
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  collectorAvatarUrl: string | null,
  citizenAvatarUrl: string | null,
) => `
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
          .avatar-marker {
            position: relative;
            width: 34px;
            height: 34px;
            border-radius: 17px;
            overflow: hidden;
            border: 2px solid #ffffff;
            box-shadow: 0 0 6px rgba(0,0,0,0.45);
          }
          .avatar-marker img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .avatar-marker::after {
            content: "";
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 10px 6px 0 6px;
            border-color: inherit transparent transparent transparent;
          }
          .avatar-marker.fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .locate-btn {
            position: absolute;
            right: 16px;
            bottom: 60px;
            width: 36px;
            height: 36px;
            border-radius: 18px;
            background-color: #ffffff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
          }
          .locate-btn span {
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="locate-btn" class="locate-btn"><span>📍</span></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
          });
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          var collectorAvatar = ${collectorAvatarUrl ? `"${collectorAvatarUrl}"` : "null"};
          var citizenAvatar = ${citizenAvatarUrl ? `"${citizenAvatarUrl}"` : "null"};

          function createAvatarIcon(url, fallbackColor, fallbackLabel) {
            var html;
            if (url) {
              html = "<div class='avatar-marker' style='border-color:" + fallbackColor + ";'><img src='" + url + "' /></div>";
            } else {
              html =
                "<div class='avatar-marker fallback' style='background-color:" +
                fallbackColor +
                "; border-color:" +
                fallbackColor +
                ";'><span>" +
                (fallbackLabel || '') +
                "</span></div>";
            }
            return L.divIcon({
              className: "custom-div-icon",
              html: html,
              iconSize: [34, 44],
              iconAnchor: [17, 40],
            });
          }

          // Icon xe ô tô cho Collector (không dùng giọt nước)
          function createCarIcon() {
            var svg =
              "<svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'>" +
              "  <defs>" +
              "    <linearGradient id='carGrad' x1='0' y1='0' x2='1' y2='1'>" +
              "      <stop offset='0%' stop-color='#2563EB' />" +
              "      <stop offset='100%' stop-color='#1D4ED8' />" +
              "    </linearGradient>" +
              "  </defs>" +
              "  <g>" +
              "    <rect x='5' y='14' width='30' height='11' rx='3' fill='url(#carGrad)' />" +
              "    <path d='M8 14 L12 8 C13 6.5 14.5 6 16.2 6 H24 c1.7 0 3.2.5 4.2 2 L32 14 Z' fill='#DBEAFE' />" +
              "    <rect x='14' y='8' width='10' height='5' rx='1' fill='#BFDBFE' />" +
              "    <circle cx='12' cy='27' r='3.2' fill='#0F172A' />" +
              "    <circle cx='28' cy='27' r='3.2' fill='#0F172A' />" +
              "    <circle cx='12' cy='27' r='1.6' fill='#6B7280' />" +
              "    <circle cx='28' cy='27' r='1.6' fill='#6B7280' />" +
              "    <circle cx='7.8' cy='19.5' r='1.4' fill='#FACC15' />" +
              "    <circle cx='32.2' cy='19.5' r='1.4' fill='#FACC15' />" +
              "  </g>" +
              "</svg>";
            var html =
              "<div style='width:40px;height:40px;display:flex;align-items:center;justify-content:center;'>" +
              svg +
              "</div>";
            return L.divIcon({
              className: "custom-div-icon",
              html: html,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });
          }

          // Collector: icon xe ô tô
          var userIcon = createCarIcon();
          // User (citizen): avatar giọt nước đỏ
          var targetIcon = createAvatarIcon(citizenAvatar, "#F44336", "U");

          // Add markers for user and target
          var start = L.latLng(${userLat}, ${userLng});
          var end = L.latLng(${targetLat}, ${targetLng});
          var collectorMarker = L.marker(start, {icon: userIcon}).addTo(map);
          L.marker(end, {icon: targetIcon}).addTo(map);
          
          var bounds = L.latLngBounds([start, end]);

          // Restore last view/zoom if available so map không reset khi WebView reload
          var savedState = null;
          try {
            savedState = JSON.parse(localStorage.getItem('collector_nav_state') || 'null');
          } catch (e) {
            savedState = null;
          }

          if (savedState && savedState.lat && savedState.lng && savedState.zoom) {
            map.setView([savedState.lat, savedState.lng], savedState.zoom);
          } else {
            map.fitBounds(bounds, {padding: [40, 40]});
          }

          map.on('moveend zoomend', function() {
            try {
              var c = map.getCenter();
              var s = { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
              localStorage.setItem('collector_nav_state', JSON.stringify(s));
            } catch (e) {
              // ignore
            }
          });

          // Use OSRM (based on OSM) to get real driving route between two points
          var fullRoute = [];
          var routeLine = null;
          var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' 
            + ${userLng} + ',' + ${userLat} + ';' + ${targetLng} + ',' + ${targetLat} 
            + '?overview=full&geometries=geojson';

          fetch(osrmUrl)
            .then(function(response) { return response.json(); })
            .then(function(data) {
              if (data.routes && data.routes.length > 0) {
                fullRoute = data.routes[0].geometry.coordinates.map(function(coord) {
                  // OSRM returns [lng, lat], Leaflet expects [lat, lng]
                  return [coord[1], coord[0]];
                });

                routeLine = L.polyline(fullRoute, {
                  color: '#2196F3',
                  weight: 4
                }).addTo(map);
              } else {
                // Fallback: draw straight line if routing fails
                fullRoute = [[${userLat}, ${userLng}], [${targetLat}, ${targetLng}]];
                routeLine = L.polyline(fullRoute, {
                  color: '#2196F3',
                  weight: 4,
                  dashArray: '8, 8'
                }).addTo(map);
              }
            })
            .catch(function(err) {
              console.error('OSRM routing error', err);
              // Fallback: draw straight line if routing fails
              fullRoute = [[${userLat}, ${userLng}], [${targetLat}, ${targetLng}]];
              routeLine = L.polyline(fullRoute, {
                color: '#2196F3',
                weight: 4,
                dashArray: '8, 8'
              }).addTo(map);
            });

          // Expose function for React Native to di chuyển marker của shipper mà không reload map
          window.updateCollectorPosition = function(lat, lng) {
            var newPos = L.latLng(lat, lng);
            collectorMarker.setLatLng(newPos);

            if (fullRoute.length > 1 && routeLine) {
              var minIdx = 0;
              var minDist = Infinity;
              for (var i = 0; i < fullRoute.length; i++) {
                var p = L.latLng(fullRoute[i][0], fullRoute[i][1]);
                var d = newPos.distanceTo(p);
                if (d < minDist) {
                  minDist = d;
                  minIdx = i;
                }
              }

              var remaining = fullRoute.slice(minIdx);
              routeLine.setLatLngs(remaining);

              // Khi tới rất gần user (< 10m) thì xóa hẳn line
              if (remaining.length && newPos.distanceTo(end) < 10) {
                map.removeLayer(routeLine);
                routeLine = null;
              }
            }
          };

          // Nút "vị trí hiện tại" - đưa map về marker của shipper mà không đổi zoom
          var locateBtn = document.getElementById('locate-btn');
          if (locateBtn) {
            locateBtn.onclick = function() {
              var pos = collectorMarker.getLatLng();
              map.setView(pos, map.getZoom());
            };
          }
        </script>
      </body>
    </html>
`;

export default function ActiveTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [task, setTask] = useState<CollectorTaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [phase, setPhase] = useState<ActivePhase>("ACCEPTED");
  const phaseRef = useRef<ActivePhase>("ACCEPTED");
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState<"ABSENT" | "ISSUE">("ABSENT");
  const [disputeReason, setDisputeReason] = useState("");
  const [citizenPresence, setCitizenPresence] = useState<"PENDING" | "CONFIRMED" | "ABSENT">("PENDING");
  const [checkingPresence, setCheckingPresence] = useState(false);

  // Weights state for completion
  const [weights, setWeights] = useState({
    organic: "",
    recyclable: "",
    hazardous: "",
  });
  const [accuracyLevel, setAccuracyLevel] = useState<"MATCH" | "MODERATE" | "HEAVY">("MATCH");
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [reportImages, setReportImages] = useState<string[]>([]);

  // Real-time clock for expiration check
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isExpired = useMemo(() => {
    if (!task?.expiredAt) return false;
    const expDate = new Date(task.expiredAt);
    return now.getTime() > expDate.getTime();
  }, [now, task?.expiredAt]);

  useEffect(() => {
    if (isExpired && (task?.status === "PENDING_COLLECTOR" || task?.status === "COLLECTOR_PENDING")) {
      Alert.alert(
        "Đơn hàng hết hạn",
        "Đơn hàng này đã hết hạn xác nhận và được chuyển cho người khác.",
        [{ text: "OK", onPress: () => router.replace("/(collectors)" as any) }]
      );
    }
  }, [isExpired, task?.status]);

  const remainingSeconds = useMemo(() => {
    if (!task?.expiredAt || isExpired) return 0;
    const diff = new Date(task.expiredAt).getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  }, [now, task?.expiredAt, isExpired]);

  const formatRemainingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Keep ref in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fake route simulation (DEV)
  const fakeRouteRef = useRef<{ latitude: number; longitude: number }[] | null>(null);
  const fakeRouteIndexRef = useRef(0);
  const fakeRouteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fakeRouteInitializedRef = useRef(false);
  const fakeRouteStartingPointRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // WebView refs để inject JS mà không reload map
  const inlineMapRef = useRef<WebView>(null);
  const modalMapRef = useRef<WebView>(null);
  const [initialCollectorPos, setInitialCollectorPos] = useState<
    { latitude: number; longitude: number } | null
  >(null);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  // Fetch route between two points and return list of [lat, lng]
  const fetchRouteMultiSource = async (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
  ): Promise<{ latitude: number; longitude: number }[] | null> => {
    // 1) Try OSRM public server (free, no key)
    try {
      const osrmUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start.longitude},${start.latitude};${end.longitude},${end.latitude}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates as [number, number][];
          return coords.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));
        }
      }
    } catch (error) {
      console.warn("OSRM route fetch error (fake GPS):", error);
    }

    // 2) Fallback: Mapbox Directions API (if key provided in config)
    const mapboxKey = config.mapboxDirectionsKey;
    if (mapboxKey) {
      try {
        const mapboxUrl =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${start.longitude},${start.latitude};${end.longitude},${end.latitude}` +
          `?geometries=geojson&overview=full&access_token=${mapboxKey}`;

        const res = await fetch(mapboxUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates as [number, number][];
            return coords.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }));
          }
        }
      } catch (error) {
        console.warn("Mapbox route fetch error (fake GPS):", error);
      }
    }

    // 3) Ultimate fallback handled by caller (linear route)
    return null;
  };

  const setupFakeRoute = async (reportLat: number, reportLng: number) => {
    if (!USE_FAKE_LOCATION || fakeRouteInitializedRef.current) return;

    // Total fake duration in ms (controlled by FAKE_ROUTE_DURATION_MINUTES)
    const durationMs = FAKE_ROUTE_DURATION_MINUTES * 60 * 1000;
    const baseIntervalMs = 10 * 1000; // base interval before we adjust to match duration
    const linearSteps = Math.max(2, Math.round(durationMs / baseIntervalMs)); // at least 2 points

    // Start ~2km away from target (approx 0.02 degrees)
    const startLat = fakeRouteStartingPointRef.current?.latitude ?? reportLat + 0.02;
    const startLng = fakeRouteStartingPointRef.current?.longitude ?? reportLng - 0.02;

    let route: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i < linearSteps; i++) {
      const t = i / (linearSteps - 1);
      route.push({
        latitude: startLat + (reportLat - startLat) * t,
        longitude: startLng + (reportLng - startLng) * t,
      });
    }

    // Try to get real driving route from OSRM / Mapbox so marker follows the same path as drawn trên map
    const routedPath = await fetchRouteMultiSource(
      { latitude: startLat, longitude: startLng },
      { latitude: reportLat, longitude: reportLng },
    );
    if (routedPath && routedPath.length > 1) {
      route = routedPath;
      // Đảm bảo điểm cuối TRÙNG CHÍNH XÁC với vị trí user (report)
      route[route.length - 1] = {
        latitude: reportLat,
        longitude: reportLng,
      };
    }

    // Điều chỉnh khoảng thời gian giữa các bước sao cho tổng thời gian ~ durationMs
    const steps = route.length;
    let intervalMs = Math.round(durationMs / steps);
    // Giới hạn tối thiểu 1s để tránh update quá dày
    if (intervalMs < 1000) intervalMs = 1000;

    fakeRouteRef.current = route;
    fakeRouteIndexRef.current = 0;
    fakeRouteInitializedRef.current = true;

    // Initialize currentLocation with starting point
    setCurrentLocation(route[0]);

    // Timer to move along the route
    fakeRouteTimerRef.current = setInterval(() => {
      if (!fakeRouteRef.current) return;

      fakeRouteIndexRef.current += 1;
      if (fakeRouteIndexRef.current >= fakeRouteRef.current.length) {
        // Reached destination
        clearInterval(fakeRouteTimerRef.current as any);
        fakeRouteTimerRef.current = null;
        fakeRouteIndexRef.current = fakeRouteRef.current.length - 1;
      }

      const nextPoint = fakeRouteRef.current[fakeRouteIndexRef.current];
      if (nextPoint) {
        setCurrentLocation(nextPoint);
      }
    }, intervalMs);
  };

  // Fetch task data
  const fetchTask = useCallback(async () => {
    try {
      let data: CollectorTaskItem | null = null;
      if (!id || id === "NaN" || id === "undefined") {
        const acceptedTasks = await collectorService.getAcceptedTasks();
        console.log(`[active-task] No ID provided, fetched ${acceptedTasks?.length || 0} accepted tasks`);
        if (acceptedTasks && acceptedTasks.length > 0) {
          data = acceptedTasks[0];
          console.log(`[active-task] Using first accepted task: ID ${data.id}, status ${data.status}`);
        }
      } else {
        data = await collectorService.getTaskById(Number(id));
        console.log(`[active-task] ID ${id} provided, fetched task status: ${data?.status}`);
      }

      if (!data) {
        setLoading(false);
        return;
      }

      setTask(data);
      // Determine phase from task status or report status (prioritize report status for arrived/collecting)
      let currentStatus = data.status;
      if (data.report?.status === "ARRIVED" || data.report?.status === "COLLECTING") {
        currentStatus = data.report.status;
      } else if (data.status === "ON_THE_WAY" || data.report?.status === "ON_THE_WAY") {
        currentStatus = "ON_THE_WAY";
      }

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

  // Ghi lại vị trí collector ban đầu để dùng cho HTML map (tránh đổi source khi fake GPS cập nhật)
  useEffect(() => {
    if (currentLocation && !initialCollectorPos) {
      setInitialCollectorPos({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, initialCollectorPos]);

  // Get current location  
  const getCurrentLocation = async () => {
    try {
      // In DEV with fake route enabled, use simulated coordinates instead of real GPS
      if (USE_FAKE_LOCATION && fakeRouteRef.current) {
        const idx = fakeRouteIndexRef.current;
        const point =
          fakeRouteRef.current[idx] ?? fakeRouteRef.current[fakeRouteRef.current.length - 1];

        if (point) {
          setCurrentLocation(point);
          return { latitude: point.latitude, longitude: point.longitude };
        }
        return;
      }

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
    }, 30000);

    // Initial send
    sendLocationUpdate();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (fakeRouteTimerRef.current) {
        clearInterval(fakeRouteTimerRef.current);
      }
    };
  }, []);

  // Khi currentLocation thay đổi, chỉ di chuyển marker trong WebView, không đổi source => không chớp map
  useEffect(() => {
    if (!currentLocation) return;

    const js = `
      if (window.updateCollectorPosition) {
        window.updateCollectorPosition(${currentLocation.latitude}, ${currentLocation.longitude});
      }
      true;
    `;

    inlineMapRef.current?.injectJavaScript(js);
    if (mapModalVisible) {
      modalMapRef.current?.injectJavaScript(js);
    }
  }, [currentLocation, mapModalVisible]);

  // Dữ liệu phụ thuộc task/report - khai báo TRƯỚC mọi early return để không vi phạm Rules of Hooks
  const report = task?.report;
  const citizen = report?.citizen;

  // HTML map chỉ tạo một lần dựa trên vị trí collector ban đầu & vị trí user
  const routingSource = useMemo(() => {
    if (!report) return { html: "" };

    const startLat = initialCollectorPos?.latitude ?? report.latitude;
    const startLng = initialCollectorPos?.longitude ?? report.longitude;

    return {
      html: getRoutingMapHtml(
        startLat,
        startLng,
        report.latitude,
        report.longitude,
        authUser?.avatar || null,
        citizen?.avatar || null,
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialCollectorPos?.latitude,
    initialCollectorPos?.longitude,
    report?.latitude,
    report?.longitude,
    authUser?.avatar,
    citizen?.avatar,
  ]);

  // Poll for citizen presence when arrived
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (phase === "ARRIVED" && citizenPresence === "PENDING" && task?.reportId) {
      const poll = async () => {
        try {
          console.log(`[Presence] Polling task ${task.id} (Report ${task.reportId}) for presence confirmation...`);

          let updatedReportData: any = null;

          // Use getTaskById as the primary poll source for collectors
          const res = await collectorService.getTaskById(task.id);

          if (res && res.report) {
            updatedReportData = res.report;
            console.log(`📡 [Presence] Fetched latest report data via task endpoint`);
          }

          if (updatedReportData) {
            const currentStatus = updatedReportData.status?.toUpperCase();
            const citizenConfirmed = !!updatedReportData.citizenConfirmedAt;
            const citizenAbsented = !!updatedReportData.citizenAbsentAt;

            console.log(`[Presence] Report ${task.reportId} status: ${currentStatus}, confirmed: ${citizenConfirmed}, absent: ${citizenAbsented}`);

            // Determine presence based on status or timestamp
            const isConfirmed = citizenConfirmed || currentStatus === "CONFIRMED_PRESENCE" || currentStatus === "COLLECTING";
            const isAbsented = citizenAbsented || currentStatus === "REPORTED_ABSENT" || currentStatus === "ABSENT";

            if (isConfirmed) {
              console.log("✅ [Presence] Citizen confirmed presence!");
              setCitizenPresence("CONFIRMED");
              showToast("Công dân đã xác nhận có mặt!", "success");
            } else if (isAbsented) {
              console.log("❌ [Presence] Citizen reported absent!");
              setCitizenPresence("ABSENT");
              showToast("Công dân báo vắng mặt. Đơn hàng sẽ kết thúc.", "info");
              setTimeout(() => router.replace("/(collectors)" as any), 2000);
            }
          } else {
            console.error(`❌ [Presence] FAILED to get updated report data for reportId: ${task.reportId}`);
          }
        } catch (error) {
          console.error("[Presence] Critical poll error:", error);
        }
      };

      poll(); // Immediate check
      interval = setInterval(poll, 5000); // Check every 5s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, citizenPresence, task?.reportId, id]);

  // Handle status changes
  const handleUpdateStatus = async (newStatus: string, statusLabel: string) => {
    // Nếu là ARRIVED, cần check khoảng cách
    if (newStatus === "ARRIVED") {
      if (!currentLocation || !report) {
        showToast("Đang xác định vị trí của bạn...", "error");
        return;
      }
      const dist = locationService.haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        report.latitude,
        report.longitude
      );

      console.log(`[active-task] Distance to target: ${dist.toFixed(3)} km`);

      if (dist > 0.5) { // 500m = 0.5km
        Alert.alert(
          "Chưa đến nơi",
          `Bạn đang cách điểm thu gom ${(dist * 1000).toFixed(0)}m. Vui lòng di chuyển đến gần hơn (dưới 500m) để xác nhận.`
        );
        return;
      }
    }

    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn chuyển sang trạng thái "${statusLabel}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              setUpdating(true);
              let res: { success: boolean; message?: string };
              if (newStatus === "ON_THE_WAY") {
                res = await collectorService.startMoving(task!.reportId);
              } else if (newStatus === "ARRIVED") {
                res = await collectorService.checkinArrived(
                  task!.reportId,
                  currentLocation!.latitude,
                  currentLocation!.longitude
                );
              } else {
                res = await collectorService.updateTaskStatus(task!.id, newStatus);
              }

              if (res.success) {
                showToast(`Đã chuyển sang: ${statusLabel}`, "success");
                if (newStatus === "ARRIVED") {
                  setPhase("ARRIVED");
                } else if (newStatus === "ON_THE_WAY") {
                  setPhase("ON_THE_WAY");
                } else if (newStatus === "COMPLETED") {
                  setPhase("COMPLETED");
                  if (pollingRef.current) clearInterval(pollingRef.current);
                  setTimeout(() => router.replace("/(collectors)" as any), 2000);
                }
                fetchTask();
              } else {
                showToast(res.message || "Không thể cập nhật trạng thái", "error");
              }
            } catch (error) {
              console.error(`[active-task] Error:`, error);
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

  const handlePickImage = async (isReport: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast("Cần quyền truy cập thư viện ảnh", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      if (isReport) {
        setReportImages([...reportImages, result.assets[0].uri]);
      } else {
        setEvidenceImages([...evidenceImages, result.assets[0].uri]);
      }
    }
  };

  const handleCompleteTask = async () => {
    if (evidenceImages.length === 0) {
      showToast("Vui lòng tải ít nhất 1 ảnh minh chứng", "error");
      return;
    }

    try {
      setUpdating(true);
      const res = await collectorService.completeTask({
        reportId: task!.reportId,
        weightOrganic: weights.organic ? parseFloat(weights.organic) : 0,
        weightRecyclable: weights.recyclable ? parseFloat(weights.recyclable) : 0,
        weightHazardous: weights.hazardous ? parseFloat(weights.hazardous) : 0,
        accuracyBucket: accuracyLevel,
        files: evidenceImages,
      });

      if (res.success) {
        showToast("Đã hoàn tất thu gom!", "success");
        setCompleteModalVisible(false);
        setPhase("COMPLETED");
        if (pollingRef.current) clearInterval(pollingRef.current);
        setTimeout(() => router.replace("/(collectors)" as any), 2000);
      } else {
        showToast(res.message || "Lỗi khi hoàn tất", "error");
      }
    } catch (error) {
      showToast("Đã có lỗi xảy ra", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleReport = async () => {
    try {
      setUpdating(true);
      let res;
      if (reportType === "ABSENT") {
        // Nếu công dân đã xác nhận đang có mặt thì không cho phép báo vắng mặt nữa
        if (citizenPresence === "CONFIRMED") {
          showToast("Khách đã xác nhận có mặt, không thể báo vắng mặt.", "error");
          setUpdating(false);
          return;
        }
        res = await collectorService.markNoResponse(task!.reportId);
      } else {
        if (!disputeReason || disputeReason.length < 5) {
          showToast("Vui lòng nhập lý do (tối thiểu 5 ký tự)", "error");
          setUpdating(false);
          return;
        }
        if (reportImages.length === 0) {
          showToast("Vui lòng tải ảnh minh chứng", "error");
          setUpdating(false);
          return;
        }
        res = await collectorService.reportDispute(task!.reportId, {
          reason: disputeReason,
          files: reportImages,
        });
      }

      if (res.success) {
        showToast("Đã gửi báo cáo", "success");
        setReportModalVisible(false);
        router.back();
      } else {
        showToast(res.message || "Lỗi khi gửi báo cáo", "error");
      }
    } catch (error) {
      showToast("Đã có lỗi xảy ra", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenMap = () => {
    // Khi user bấm nút "Xem chỉ đường chi tiết" mới bắt đầu fake GPS (DEV)
    if (
      USE_FAKE_LOCATION &&
      !fakeRouteInitializedRef.current &&
      task?.report?.latitude &&
      task?.report?.longitude
    ) {
      // Nếu hiện đang có currentLocation thật, dùng nó làm điểm xuất phát để route đẹp hơn
      if (currentLocation) {
        fakeRouteStartingPointRef.current = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };
      }
      // Khởi tạo fake route (bắt đầu chạy trong ~FAKE_ROUTE_DURATION_MINUTES phút)
      setupFakeRoute(task.report.latitude, task.report.longitude);
    }

    // Mở bản đồ OSM full-screen ngay trong app (không rời ứng dụng)
    setMapModalVisible(true);
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
        {phase === "ARRIVED" ? (
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Xác nhận thông tin thu gom</Text>

            <Text style={styles.inputLabel}>Cân nặng thực tế (kg)</Text>
            <View style={styles.weightInputRow}>
              <View style={styles.weightItem}>
                <Text style={styles.weightTypeLabel}>Hữu cơ</Text>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  placeholder="0.0"
                  value={weights.organic}
                  onChangeText={(text) => setWeights({ ...weights, organic: text })}
                />
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightTypeLabel}>Tái chế</Text>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  placeholder="0.0"
                  value={weights.recyclable}
                  onChangeText={(text) => setWeights({ ...weights, recyclable: text })}
                />
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightTypeLabel}>Nguy hại</Text>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  placeholder="0.0"
                  value={weights.hazardous}
                  onChangeText={(text) => setWeights({ ...weights, hazardous: text })}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Độ chính xác so với khách báo</Text>
            <View style={styles.accuracyRow}>
              {(["MATCH", "MODERATE", "HEAVY"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.accuracyChip,
                    accuracyLevel === level && styles.accuracyChipActive,
                  ]}
                  onPress={() => setAccuracyLevel(level)}
                >
                  <Text
                    style={[
                      styles.accuracyChipText,
                      accuracyLevel === level && styles.accuracyChipTextActive,
                    ]}
                  >
                    {level === "MATCH" ? "Đúng" : level === "MODERATE" ? "Sai số" : "Sai nhiều"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Ảnh minh chứng (ít nhất 1 ảnh)</Text>
            <TouchableOpacity style={styles.photoUploadBtn} onPress={() => handlePickImage(false)}>
              <Ionicons name="camera" size={24} color={AppColors.primary} />
              <Text style={styles.photoUploadText}>Tải ảnh lên</Text>
            </TouchableOpacity>

            <View style={styles.evidenceImagesRow}>
              {evidenceImages.map((uri, index) => (
                <View key={index} style={styles.imageThumbContainer}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setEvidenceImages(evidenceImages.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={20} color={AppColors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={{ height: 12 }} />
          </Card>
        ) : (
          <>
            {/* Map Area - Hiển thị thông tin vị trí */}
            {phase === "ON_THE_WAY" && (
              <Card variant="elevated" style={styles.mapCard}>
                <View style={styles.mapContainer}>
                  {currentLocation && report ? (
                    <WebView
                      ref={inlineMapRef}
                      originWhitelist={["*"]}
                      source={routingSource}
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
                    {report && (
                      <Text style={styles.routeCoords}>
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={styles.openMapBtn} onPress={handleOpenMap}>
                  <Ionicons name="navigate" size={20} color={AppColors.white} />
                  <Text style={styles.openMapText}>Xem chỉ đường chi tiết</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* Order Info */}
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
              <InfoRow icon="document-text" label="Mã đơn" value={`#${task.reportId}`} />
              {report && (
                <>
                  <InfoRow icon="location" label="Địa chỉ" value={report.address} />
                  <InfoRow
                    icon="chatbox"
                    label="Mô tả"
                    value={report.description || "Không có mô tả"}
                  />
                </>
              )}
            </Card>

            {/* Waste Items */}
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Phân loại rác</Text>
              {report &&
                report.wasteItems.map((item, idx) => (
                  <View key={idx} style={styles.wasteItemRow}>
                    <View style={styles.wasteItemTag}>
                      <Text style={styles.wasteItemType}>{getWasteTypeLabel(item.wasteType)}</Text>
                    </View>
                    <Text style={styles.wasteItemWeight}>{item.weightKg.toFixed(1)} kg</Text>
                  </View>
                ))}
            </Card>

            {/* Images */}
            {report?.images && report.images.length > 0 && (
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
                {citizen && (
                  <>
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
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => citizen.phone && handleCall(citizen.phone)}
                    >
                      <Ionicons name="call" size={20} color={AppColors.white} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Card>
          </>
        )}

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
            </>
          )}

          {phase === "ARRIVED" && (
            <>
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: AppColors.success }]}
                onPress={handleCompleteTask}
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
                {citizenPresence !== "CONFIRMED" && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      (!isExpired || updating) && { opacity: 0.6 }
                    ]}
                    onPress={() => {
                      if (!isExpired) {
                        Alert.alert(
                          "Chưa đủ thời gian chờ",
                          `Vui lòng chờ thêm ${formatRemainingTime(remainingSeconds)} trước khi có thể báo vắng khách.`
                        );
                        return;
                      }
                      setReportType("ABSENT");
                      setReportModalVisible(true);
                    }}
                    disabled={updating || !isExpired}
                  >
                    <Ionicons
                      name="person-remove"
                      size={18}
                      color={isExpired ? AppColors.warning : AppColors.gray[400]}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={[
                        styles.secondaryBtnText,
                        { color: isExpired ? AppColors.warning : AppColors.gray[500] }
                      ]}>
                        Báo vắng khách
                      </Text>
                      {!isExpired && (
                        <Text style={{ fontSize: 10, color: AppColors.gray[400] }}>
                          Chờ {formatRemainingTime(remainingSeconds)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setReportType("ISSUE");
                    setReportModalVisible(true);
                  }}
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

      {/* Reporting Modal (Absent/Issue) */}
      <Modal
        visible={reportModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.modalBox, { width: "90%" }]}>
            <Text style={styles.modalTitle}>
              {reportType === "ABSENT" ? "Xác nhận vắng khách" : "Báo cáo sự cố"}
            </Text>

            <Text style={styles.modalDescription}>
              {reportType === "ABSENT"
                ? "Bạn xác nhận khách hàng không có mặt để thu gom rác sau thời gian chờ?"
                : "Vui lòng mô tả chi tiết sự cố hoặc hành vi lừa đảo."}
            </Text>

            {reportType === "ISSUE" && (
              <>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Nhập lý do ít nhất 5 ký tự..."
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                />

                <TouchableOpacity style={styles.photoUploadBtnSmall} onPress={() => handlePickImage(true)}>
                  <Ionicons name="camera" size={20} color={AppColors.primary} />
                  <Text style={styles.photoUploadTextSmall}>Thêm ảnh bằng chứng</Text>
                </TouchableOpacity>

                <View style={styles.evidenceImagesRow}>
                  {reportImages.map((uri, index) => (
                    <View key={index} style={styles.imageThumbContainer}>
                      <Image source={{ uri }} style={styles.imageThumbSmall} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => setReportImages(reportImages.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={18} color={AppColors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalFooterActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: reportType === "ABSENT" ? AppColors.warning : AppColors.error }]}
                onPress={handleReport}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Gửi báo cáo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen OSM navigation modal */}
      {currentLocation && report && (
        <Modal
          visible={mapModalVisible}
          animationType="slide"
          onRequestClose={() => setMapModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: AppColors.background }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: AppColors.white,
                borderBottomWidth: 1,
                borderBottomColor: AppColors.gray[200],
              }}
            >
              <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                <Ionicons name="close" size={24} color={AppColors.gray[700]} />
              </TouchableOpacity>
              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "700",
                  color: AppColors.gray[800],
                }}
              >
                Chi tiết đường đi
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <WebView
              originWhitelist={["*"]}
              ref={modalMapRef}
              source={routingSource}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>
      )}
    </View >
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
  // Modals
  modalSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  modalContent: {
    flexGrow: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[700],
    marginBottom: 10,
    marginTop: 16,
  },
  weightInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  weightItem: {
    flex: 1,
  },
  weightTypeLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginBottom: 4,
  },
  weightInput: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.gray[800],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  accuracyRow: {
    flexDirection: "row",
    gap: 10,
  },
  accuracyChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  accuracyChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  accuracyChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[600],
  },
  accuracyChipTextActive: {
    color: AppColors.white,
  },
  photoUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "08",
  },
  photoUploadText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.primary,
  },
  evidenceImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  imageThumbContainer: {
    position: "relative",
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageThumbSmall: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: AppColors.white,
    borderRadius: 10,
  },
  // Modal center box
  modalCenterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
  },
  modalDescription: {
    fontSize: 14,
    color: AppColors.gray[500],
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  textArea: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: AppColors.gray[800],
    textAlignVertical: "top",
    minHeight: 100,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  photoUploadBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  photoUploadTextSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  modalFooterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray[600],
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.white,
  },
});
