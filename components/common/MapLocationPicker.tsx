import { AppColors } from "@/constants/theme";
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

export const MapLocationPicker = ({
    label = "Chọn vị trí trên bản đồ",
    initialLocation,
    onLocationSelect,
    error,
}: MapLocationPickerProps) => {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    }>(initialLocation || DEFAULT_LOCATION);

    // Sync state if initialLocation prop changes from outside
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
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

    const webViewRef = useRef<WebView>(null);
    const previewWebViewRef = useRef<WebView>(null);

    // Initial load reverse geocode
    useEffect(() => {
        const init = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const lat = initialLocation?.latitude || DEFAULT_LOCATION.latitude;
                const lng = initialLocation?.longitude || DEFAULT_LOCATION.longitude;
                reverseGeocode(lat, lng);
            }
        };
        init();
    }, []);

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== "granted") {
                const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setAddress(fallback);
                onLocationSelect({ latitude, longitude, address: fallback });
                return;
            }

            const results = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (results && results.length > 0) {
                const result = results[0];
                const formattedAddress = [
                    result.name,
                    result.street,
                    result.district,
                    result.subregion,
                    result.city,
                    result.region,
                    result.country,
                ].filter(Boolean).join(", ");

                setAddress(formattedAddress);

                // Normalize Expo result to match our search result format
                const normalizedAddress = {
                    city: result.city || result.region || "",
                    district: result.district || result.subregion || "",
                    ward: result.subregion || result.street || result.name || "",
                    street: result.street || result.name || "",
                    region: result.region || result.city || "",
                    name: result.name || "",
                    country: result.country || "Vietnam"
                };

                onLocationSelect({
                    latitude,
                    longitude,
                    address: formattedAddress,
                    rawAddress: normalizedAddress,
                });
            }
        } catch (error) {
            console.error("Error reverse geocoding:", error);
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
                        'User-Agent': 'EcoCollect-App/1.0',
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
        const rawAddress: any = {
            city: addr.city || addr.town || addr.province || "",
            district: addr.district || addr.county || addr.city_district || addr.suburb || "",
            ward: addr.suburb || addr.subdistrict || addr.hamlet || addr.village || addr.quarter || addr.neighbourhood || "",
            street: addr.road || addr.street || "",
            region: addr.state || addr.city || "",
            name: addr.road || addr.suburb || addr.name || "",
            country: "Vietnam"
        };

        const formattedAddress = item.display_name;
        setAddress(formattedAddress);

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
            reverseGeocode(newPos.latitude, newPos.longitude);
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
                setLocation(data);
                reverseGeocode(data.latitude, data.longitude);
            }
        } catch (e) {
            console.error("Error parsing message from WebView:", e);
        }
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
          #map { height: 100vh; width: 100vw; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-marker">
          <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="width: 25px; height: 41px;" />
        </div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: ${interactive},
            touchZoom: ${interactive},
            doubleClickZoom: ${interactive},
            scrollWheelZoom: ${interactive}
          }).setView([${lat}, ${lng}], 16);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          ${interactive ? `
          map.on('moveend', function() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              latitude: center.lat,
              longitude: center.lng
            }));
          });
          ` : ''}

          window.updatePosition = function(lat, lng) {
            map.setView([lat, lng], 16);
          };
        </script>
      </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            {/* Preview Section - Clickable to open full map */}
            <TouchableOpacity
                style={styles.previewContainer}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <WebView
                    ref={previewWebViewRef}
                    originWhitelist={["*"]}
                    source={{ html: getMapHtml(location.latitude, location.longitude, false) }}
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
                            ref={webViewRef}
                            originWhitelist={["*"]}
                            source={{ html: getMapHtml(location.latitude, location.longitude) }}
                            style={styles.fullMap}
                            onMessage={onMessage}
                        />

                        <TouchableOpacity
                            style={styles.modalLocationButton}
                            onPress={getCurrentLocation}
                        >
                            <Ionicons name="locate" size={24} color={AppColors.primary} />
                        </TouchableOpacity>

                        <View style={styles.addressFloating}>
                            <Text style={styles.floatingAddressText} numberOfLines={2}>
                                {address || "Đang lấy địa chỉ..."}
                            </Text>
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
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
    addressFloating: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: 12,
        borderRadius: 12,
        elevation: 3,
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
});
