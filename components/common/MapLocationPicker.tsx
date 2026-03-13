import { AppColors } from "@/constants/theme";
import { locationService } from "@/services/location.service";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { WebView } from "react-native-webview";

interface MapLocationPickerProps {
    label?: string;
    initialLocation?: {
        latitude: number;
        longitude: number;
    };
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        address: string;
        rawAddress?: any;
    }) => void;
    error?: string;
}

const DEFAULT_LOCATION = {
    latitude: 21.0285, // Hanoi default
    longitude: 105.8542,
};

const getMapHtml = (lat: number, lng: number, interactive = true) => `
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
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            transition: transform 0.2s ease-out;
          }
          .map-moving .center-marker {
            transform: translate(-50%, -115%) scale(1.1);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-marker" id="pin">
          <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="width: 25px; height: 41px;" />
        </div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: ${interactive},
            touchZoom: ${interactive},
            doubleClickZoom: ${interactive},
            scrollWheelZoom: ${interactive},
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
            inertia: true,
            inertiaDeceleration: 3000,
            inertiaMaxSpeed: 1500,
            easeLinearity: 0.1,
            preferCanvas: true,
            tap: false // Recommended for Mobile
          }).setView([${lat}, ${lng}], 16);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
          }).addTo(map);

          var pin = document.getElementById('pin');

          ${interactive ? `
          map.on('movestart', function() {
            document.body.classList.add('map-moving');
          });

          map.on('moveend', function() {
            document.body.classList.remove('map-moving');
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              latitude: center.lat,
              longitude: center.lng
            }));
          });
          ` : ''}

          window.updatePosition = function(lat, lng) {
            map.flyTo([lat, lng], map.getZoom(), {
                animate: true,
                duration: 0.8,
                easeLinearity: 0.25
            });
          };
        </script>
      </body>
    </html>
  `;

export const MapLocationPicker = ({
    label = "Chọn vị trí trên bản đồ",
    initialLocation,
    onLocationSelect,
    error,
}: MapLocationPickerProps): React.ReactElement => {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    }>(initialLocation || DEFAULT_LOCATION);

    // Sync state if initialLocation prop changes from outside
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
            // If modal is not open, we should also update the HTML source point
            // so opening the modal later starts at this new position.
            if (!modalVisible) {
                setHtmlCoords(initialLocation);
            }
            // Also update maps if they are already initialized
            const script = `if (window.updatePosition) window.updatePosition(${initialLocation.latitude}, ${initialLocation.longitude});`;
            webViewRef.current?.injectJavaScript(script);
            previewWebViewRef.current?.injectJavaScript(script);
        }
    }, [initialLocation?.latitude, initialLocation?.longitude]);

    const [address, setAddress] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editedAddress, setEditedAddress] = useState("");
    const [validating, setValidating] = useState(false);
    const [isStale, setIsStale] = useState(false);
    const [currentRawAddress, setCurrentRawAddress] = useState<any>(null);

    const webViewRef = useRef<WebView>(null);
    const previewWebViewRef = useRef<WebView>(null);
    const lastFetchRef = useRef<{ lat: number; lng: number } | null>(null);
    const fetchTimeoutRef = useRef<any>(null);

    // Coordinate state for INITIALizing the WebViews (to avoid reloads while dragging)
    const [htmlCoords, setHtmlCoords] = useState({
        latitude: initialLocation?.latitude || DEFAULT_LOCATION.latitude,
        longitude: initialLocation?.longitude || DEFAULT_LOCATION.longitude
    });

    // Memoize HTML to prevent reloading the whole WebView when state changes
    // It only re-memoizes when htmlCoords changes (hard reset points)
    const mapHtml = React.useMemo(() => getMapHtml(htmlCoords.latitude, htmlCoords.longitude), [htmlCoords.latitude, htmlCoords.longitude]);
    const previewMapHtml = React.useMemo(() => getMapHtml(htmlCoords.latitude, htmlCoords.longitude, false), [htmlCoords.latitude, htmlCoords.longitude]);

    // Initial load permissions only (Do NOT initial fetch address automatically to avoid race conditions)
    useEffect(() => {
        const init = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
        };
        init();
    }, []);

    const reverseGeocode = async (latitude: number, longitude: number, notifyParent = false) => {
        try {
            console.log("🔍 Native Geocoding for:", latitude, longitude);
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (!results || results.length === 0) {
                throw new Error("No native geocode results");
            }

            const addr = results[0];
            // Normalize native geocoder format to our internal rawAddress structure
            const rawAddress = {
                house_number: addr.streetNumber || "",
                road: addr.street || "",
                city: addr.subregion || addr.city || "",
                province: addr.region || "",
                district: addr.subregion || addr.city || "",
                ward: addr.district || addr.street || "",
                street: addr.street || "",
                region: addr.region || "",
                name: addr.name || addr.street || "",
                country: addr.country || "Vietnam",
                osm_city: addr.city || "",
                osm_town: addr.city || "",
                osm_suburb: addr.district || "",
                osm_city_district: addr.subregion || "",
            };

            const formattedAddress = [
                addr.name,
                addr.street,
                addr.district,
                addr.subregion || addr.city,
                addr.region,
                addr.country
            ].filter(Boolean).join(", ") || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            setAddress(formattedAddress);
            setCurrentRawAddress(rawAddress);
            setIsStale(false);

            if (notifyParent) {
                onLocationSelect({
                    latitude,
                    longitude,
                    address: formattedAddress,
                    rawAddress,
                });
            }
            return { address: formattedAddress, rawAddress };
        } catch (error) {
            console.error("Error reverse geocoding (Native falling back to manual):", error);
            const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setAddress(fallback);
            setIsStale(false);
            if (notifyParent) {
                onLocationSelect({ latitude, longitude, address: fallback });
            }
            return { address: fallback, rawAddress: null };
        }
    };

    // Real-time debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                handleSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=vn&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'ECONNET-App/1.0',
                        'Accept-Language': 'vi-VN,vi;q=0.9',
                    }
                }
            );

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                setSearchResults(data);
            } else {
                console.error("Non-JSON response received from Nominatim");
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const selectSearchResult = (item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const newPos = { latitude: lat, longitude: lon };

        setLocation(newPos);
        setSearchQuery(item.display_name);
        setSearchResults([]);

        // Map Nominatim address to a consolidated format for easier matching
        const addr = item.address || {};
        // Nominatim VN Mapping Refinement
        const provinceCandidate = addr.state || addr.province || addr.city || addr.town || "";
        const districtCandidate = addr.city || addr.town || addr.district || addr.county || addr.city_district || "";
        let wardCandidate = addr.city_district || addr.subdistrict || addr.quarter || addr.suburb || addr.village || addr.hamlet || addr.neighbourhood || "";

        // Special logic for "Thành phố Thủ Đức" where ward might equal district/city in OSM
        if (wardCandidate === districtCandidate && (addr.suburb || addr.neighbourhood)) {
            wardCandidate = addr.suburb || addr.neighbourhood || "";
        }

        const rawAddress = {
            house_number: addr.house_number || "",
            road: addr.road || "",
            city: addr.city || addr.town || addr.municipality || "",
            province: addr.state || addr.province || "",
            district: addr.city_district || addr.district || addr.county || "",
            ward: addr.subdistrict || addr.quarter || addr.suburb || addr.village || addr.hamlet || addr.neighbourhood || "",
            street: addr.road || addr.street || "",
            region: addr.state || addr.province || addr.city || "",
            name: addr.road || addr.city_district || addr.suburb || addr.name || "",
            country: "Vietnam",
            // Extra fields for robust matching in CreateReport
            osm_city: addr.city || "",
            osm_town: addr.town || "",
            osm_suburb: addr.suburb || "",
            osm_city_district: addr.city_district || "",
        };

        const formattedAddress = item.display_name;
        setAddress(formattedAddress);
        setCurrentRawAddress(rawAddress);
        setIsStale(false);

        // Update WebView map
        const script = `window.updatePosition(${lat}, ${lon});`;
        webViewRef.current?.injectJavaScript(script);

        // Notify parent immediately with data from search
        onLocationSelect({
            latitude: lat,
            longitude: lon,
            address: formattedAddress,
            rawAddress: rawAddress
        });

        // Also trigger reverse geocode to get precise local names if needed
        // but the Nominatim data is usually good enough.
    };

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setLoading(false);
                Alert.alert(
                    "Cần quyền truy cập vị trí",
                    "Ứng dụng cần quyền truy cập vị trí để hiển thị vị trí của bạn trên bản đồ. Bạn có muốn mở Cài đặt?",
                    [
                        { text: "Không", style: "cancel" },
                        {
                            text: "Có",
                            onPress: () => {
                                // Mở Settings để user cấp quyền
                                if (Platform.OS === 'ios') {
                                    Linking.openURL('app-settings:');
                                } else {
                                    Linking.openSettings();
                                }
                            }
                        }
                    ]
                );
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const newPos = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setLocation(newPos);
            const script = `window.updatePosition(${newPos.latitude}, ${newPos.longitude});`;
            webViewRef.current?.injectJavaScript(script);
            setIsStale(true); // Tag as stale so confirm button knows it needs to fetch
        } catch (error) {
            Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
        } finally {
            setLoading(false);
        }
    };

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.latitude && data.longitude) {
                // Update internal state
                setLocation(data);

                // Just update internal coordinate state and mark as stale
                // DO NOT trigger reverse geocode automatically anymore
                setIsStale(true);
                lastFetchRef.current = { lat: data.latitude, lng: data.longitude };
            }
        } catch (e) {
            console.error("Error parsing message from WebView:", e);
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            {/* Preview Section - Clickable to open full map */}
            <TouchableOpacity
                style={styles.previewContainer}
                onPress={() => {
                    setHtmlCoords(location); // Snap current location for modal start
                    setModalVisible(true);
                }}
                activeOpacity={0.8}
            >
                <WebView
                    key={`preview-${htmlCoords.latitude}-${htmlCoords.longitude}`}
                    ref={previewWebViewRef}
                    originWhitelist={["*"]}
                    source={{ html: previewMapHtml }}
                    style={styles.mapPreview}
                    pointerEvents="none"
                />
                <View style={styles.previewOverlay}>
                    <Ionicons name="expand" size={24} color={AppColors.white} style={styles.expandIcon} />
                    <Text style={styles.previewText}>Chạm để mở bản đồ và tìm kiếm</Text>
                </View>
            </TouchableOpacity>

            {/* <View style={styles.infoContainer}> */}
            {/* <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Tọa độ:</Text>
                    <Text style={styles.coordValue}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
                </View> */}
            {/* {address ? (
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressLabel}>Địa chỉ:</Text>
                        <Text style={styles.addressValue} numberOfLines={2}>{address}</Text>
                    </View>
                ) : null}
            </View> */}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Full Screen Map Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    {/* Header with Search */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
                            <Ionicons name="close" size={28} color={AppColors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm địa chỉ..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={() => handleSearch(searchQuery)}
                                returnKeyType="search"
                            />
                            {searching ? (
                                <ActivityIndicator size="small" color={AppColors.primary} style={styles.searchIcon} />
                            ) : (
                                <TouchableOpacity onPress={() => handleSearch(searchQuery)} style={styles.searchIcon}>
                                    <Ionicons name="search" size={20} color={AppColors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Search Results Overlay */}
                    {searchResults.length > 0 && (
                        <View style={styles.resultsOverlay}>
                            <ScrollView bounces={false} style={{ maxHeight: '100%' }}>
                                {searchResults.map((item, index) => {
                                    // Split display name into main location and sub-address (G-Maps style)
                                    const parts = item.display_name.split(',');
                                    const mainText = parts[0].trim();
                                    const subText = parts.slice(1).join(',').trim();

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.resultItem}
                                            onPress={() => selectSearchResult(item)}
                                        >
                                            <View style={styles.iconCircle}>
                                                <Ionicons
                                                    name={index < 3 ? "time-outline" : "location-outline"}
                                                    size={18}
                                                    color={AppColors.textSecondary}
                                                />
                                            </View>
                                            <View style={styles.resultTextContainer}>
                                                <Text style={styles.mainResultText} numberOfLines={1}>{mainText}</Text>
                                                <Text style={styles.subResultText} numberOfLines={1}>{subText}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* Map Section */}
                    <View style={styles.fullMapContainer}>
                        <WebView
                            key={`full-${htmlCoords.latitude}-${htmlCoords.longitude}`}
                            ref={webViewRef}
                            originWhitelist={["*"]}
                            source={{ html: mapHtml }}
                            style={styles.fullMap}
                            onMessage={onMessage}
                        />

                        <TouchableOpacity
                            style={styles.modalLocationButton}
                            onPress={getCurrentLocation}
                        >
                            <Ionicons name="locate" size={24} color={AppColors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Button */}
                    <View style={styles.modalFooter}>
                        <View style={{ marginBottom: 16 }}>
                            {isEditingAddress ? (
                                <View style={styles.editAddressContainer}>
                                    <TextInput
                                        style={styles.editAddressInput}
                                        value={editedAddress}
                                        onChangeText={setEditedAddress}
                                        placeholder="Nhập địa chỉ chi tiết..."
                                        multiline
                                    />
                                    <View style={styles.editActionRow}>
                                        <TouchableOpacity
                                            onPress={() => setIsEditingAddress(false)}
                                            style={[styles.editActionBtn, styles.editCancelBtn]}
                                        >
                                            <Text style={styles.editCancelText}>Hủy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setIsEditingAddress(false)}
                                            style={[styles.editActionBtn, styles.editSaveBtn]}
                                        >
                                            <Text style={styles.editSaveText}>Lưu</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.displayAddressRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalAddressLabel}>Địa chỉ đang chọn:</Text>
                                        <Text style={[styles.floatingAddressText, { textAlign: 'left' }, isStale && { color: AppColors.gray[500], fontStyle: 'italic' }]} numberOfLines={2}>
                                            {isStale ? "Nhấn Xác nhận bên dưới để lấy địa chỉ mới..." : (editedAddress || address || "Đang lấy địa chỉ...")}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editIconBtn}
                                        onPress={() => {
                                            setEditedAddress(editedAddress || address);
                                            setIsEditingAddress(true);
                                        }}
                                    >
                                        <Ionicons name="create-outline" size={24} color={AppColors.primary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmButton, (validating || isEditingAddress) && { opacity: 0.7 }]}
                            onPress={async () => {
                                if (isEditingAddress) {
                                    Alert.alert("Thông báo", "Vui lòng lưu địa chỉ trước khi xác nhận");
                                    return;
                                }

                                setValidating(true);
                                let finalAddress = editedAddress || address;
                                let finalRawAddress = currentRawAddress;

                                // If coordinates moved, fetch the address now
                                if (isStale) {
                                    const geoResult = await reverseGeocode(location.latitude, location.longitude);
                                    finalAddress = geoResult.address;
                                    finalRawAddress = geoResult.rawAddress;
                                    setCurrentRawAddress(geoResult.rawAddress); // Update state here
                                }

                                const pinLat = location.latitude;
                                const pinLon = location.longitude;

                                // Validation logic: If user edited the address, check distance
                                if (editedAddress && editedAddress !== address) {
                                    setValidating(true);
                                    // Use location bias to find address in the same area
                                    const geoResult = await locationService.geocodeAddress(editedAddress, pinLat, pinLon);

                                    if (geoResult.success && geoResult.data) {
                                        const dist = locationService.haversineDistance(
                                            pinLat,
                                            pinLon,
                                            geoResult.data.latitude,
                                            geoResult.data.longitude
                                        );

                                        console.log(`📏 Validation distance from pin: ${dist.toFixed(3)} km`);

                                        if (dist > 2.0) {
                                            setValidating(false);
                                            Alert.alert(
                                                "Vị trí không hợp lệ",
                                                `Địa chỉ bạn nhập cách vị trí trên bản đồ ${dist.toFixed(1)}km (vượt quá giới hạn 2km). Vui lòng nhập địa chỉ gần vị trí đã ghim hơn.`
                                            );
                                            return;
                                        }

                                        // Update internal state to new coordinates
                                        const newLat = geoResult.data.latitude;
                                        const newLon = geoResult.data.longitude;
                                        setLocation({ latitude: newLat, longitude: newLon });

                                        // Force UI to repin
                                        const script = `window.updatePosition(${newLat}, ${newLon});`;
                                        webViewRef.current?.injectJavaScript(script);

                                        // NEW: Fetch structural data for the new location to update parent Pickers
                                        const finalGeoResult = await reverseGeocode(newLat, newLon);

                                        setValidating(false);
                                        setAddress(finalAddress);
                                        setModalVisible(false);

                                        // Notify parent with the new coordinates and structured data
                                        onLocationSelect({
                                            latitude: newLat,
                                            longitude: newLon,
                                            address: finalAddress,
                                            rawAddress: finalGeoResult.rawAddress
                                        });

                                    } else {
                                        setValidating(false);
                                        Alert.alert(
                                            "Không thể xác minh",
                                            "Hệ thống không thể xác định vị trí của địa chỉ này để kiểm tra khoảng cách. Vui lòng nhập rõ ràng hơn."
                                        );
                                        return;
                                    }
                                } else {
                                    // Address wasn't edited manually, just confirm the current map position.
                                    setAddress(finalAddress);
                                    setValidating(false);
                                    setModalVisible(false);

                                    onLocationSelect({
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                        address: finalAddress,
                                        rawAddress: finalRawAddress
                                    });
                                }
                            }}
                            disabled={validating}
                        >
                            {validating ? (
                                <ActivityIndicator color={AppColors.white} />
                            ) : (
                                <Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.textPrimary,
        marginBottom: 8,
    },
    previewContainer: {
        height: 180,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: AppColors.surface,
        position: "relative",
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    mapPreview: {
        flex: 1,
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    expandIcon: {
        marginBottom: 8,
    },
    previewText: {
        color: AppColors.white,
        fontSize: 14,
        fontWeight: "600",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    infoContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: AppColors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    coordRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    coordLabel: {
        fontSize: 13,
        color: AppColors.textSecondary,
        fontWeight: "500",
    },
    coordValue: {
        fontSize: 13,
        color: AppColors.textPrimary,
        fontWeight: "600",
    },
    addressContainer: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: AppColors.border,
    },
    addressLabel: {
        fontSize: 12,
        color: AppColors.textSecondary,
        fontWeight: "500",
        marginBottom: 2,
    },
    addressValue: {
        fontSize: 13,
        color: AppColors.textPrimary,
        lineHeight: 18,
    },
    errorText: {
        color: AppColors.error,
        fontSize: 12,
        marginTop: 4,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: AppColors.white,
        zIndex: 10,
    },
    backButton: {
        marginRight: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.gray[100],
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: AppColors.textPrimary,
    },
    searchIcon: {
        marginLeft: 8,
    },
    resultsOverlay: {
        position: "absolute",
        top: 80,
        left: 16,
        right: 16,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        maxHeight: 400,
        zIndex: 100,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        overflow: "hidden", // Crucial fix for spillover
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[100],
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AppColors.gray[100],
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    resultTextContainer: {
        flex: 1,
    },
    mainResultText: {
        fontSize: 15,
        fontWeight: "500",
        color: AppColors.textPrimary,
    },
    subResultText: {
        fontSize: 13,
        color: AppColors.textSecondary,
        marginTop: 2,
    },
    fullMapContainer: {
        flex: 1,
        position: "relative",
    },
    fullMap: {
        flex: 1,
    },
    modalLocationButton: {
        position: "absolute",
        bottom: 100,
        right: 16,
        backgroundColor: AppColors.white,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalAddressLabel: {
        fontSize: 12,
        color: AppColors.textSecondary,
        fontWeight: "600",
        marginBottom: 2,
    },
    floatingAddressText: {
        fontSize: 13,
        color: AppColors.textPrimary,
        textAlign: "center",
        fontWeight: "500",
    },
    modalFooter: {
        padding: 16,
        backgroundColor: AppColors.white,
        borderTopWidth: 1,
        borderTopColor: AppColors.gray[200],
    },
    confirmButton: {
        backgroundColor: AppColors.primary,
        height: 52,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    confirmButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    displayAddressRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    editIconBtn: {
        marginLeft: 8,
        padding: 4,
    },
    editAddressContainer: {
        width: '100%',
    },
    editAddressInput: {
        backgroundColor: AppColors.white,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: AppColors.textPrimary,
        borderWidth: 1,
        borderColor: AppColors.border,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    editActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    editActionBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginLeft: 8,
    },
    editCancelBtn: {
        backgroundColor: AppColors.gray[100],
    },
    editCancelText: {
        color: AppColors.textSecondary,
        fontWeight: '500',
    },
    editSaveBtn: {
        backgroundColor: AppColors.primary,
    },
    editSaveText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
});
