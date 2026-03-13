import { AlertType, Button, Card, CustomAlert, Header, Input, MapLocationPicker, Picker } from "@/components/common";
import { WasteTypeSelector } from "@/components/waste";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOCATION_DATA, WASTE_TYPES } from "@/data/mockData";
import { District, locationService, Province, Ward } from "@/services/location.service";
import { wasteService } from "@/services/waste.service";
import { BackendWasteItem, WasteType } from "@/types";
import { getWasteTypeLabel } from "@/utils/helpers";
import { validateRequired } from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function CreateReportScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wasteItems, setWasteItems] = useState<BackendWasteItem[]>([]);
  const [currentType, setCurrentType] = useState<WasteType>("ORGANIC");
  const [currentWeight, setCurrentWeight] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    type?: string;
    weight?: string;
    items?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    location?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  // Dynamic location data (fetched from API)
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [latitude, setLatitude] = useState(10.7769);
  const [longitude, setLongitude] = useState(106.7009);
  const [mapLocation, setMapLocation] = useState<any>(null);

  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [isFieldAutoFilled, setIsFieldAutoFilled] = useState({
    province: false,
    district: false,
    ward: false
  });

  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const lastRequestId = React.useRef(0);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons?: any[];
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info"
  });

  const showAlert = (title: string, message: string, type: AlertType = "info", buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    const res = await locationService.getProvinces();
    if (res.success && res.data) setProvinces(res.data);
  };

  const askToUseCurrentLocation = () => {
    showAlert(
      t("createReport.locationTitle"),
      t("createReport.locationAsk"),
      "info",
      [
        {
          text: t("createReport.locationYes"),
          onPress: getCurrentLocation
        },
        {
          text: t("createReport.locationNo"),
          style: "cancel"
        }
      ]
    );
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t("common.error"), t("createReport.locationDenied"), "error");
        return;
      }

      setLoading(true);

      // Fast path: try last known position first for instant UI response
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setMapLocation({ ...coords, address: "Đang xác định..." });
      }

      // Precise path: get fresh location with balanced accuracy (faster than High)
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      // Pin immediately even without address
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setMapLocation({ ...coords, address: "Đang xác định địa chỉ..." });

      // Run reverse geocoding
      console.log('📍 Getting address for coords:', coords);
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        const res = results[0];
        console.log('🌍 Reverse geocode result:', JSON.stringify(res, null, 2));
        const formattedAddress = [
          res.streetNumber,
          res.street || res.name,
          res.district,
          res.subregion,
          res.region,
          res.country
        ].filter(Boolean).join(", ");

        const provinceCand = res.region || res.city || "";
        const districtCand = res.subregion || res.district || "";
        let wardCand = res.district || "";

        const normalized = {
          city: provinceCand,
          district: districtCand,
          ward: wardCand,
          street: res.street || res.name || "",
          region: provinceCand,
          name: res.name || ""
        };

        console.log('📞 Calling handleMapLocationSelect with coords:', coords);
        handleMapLocationSelect({
          ...coords,
          address: formattedAddress,
          rawAddress: normalized
        });
      } else {
        // If reverse geocode fails, still keep the pin but show coordinates as address
        setMapLocation({
          ...coords,
          address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeLocationName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/^(tinh|thanh pho|thanh pho|quan|huyen|thi xa|phuong|xa|thi tran|p\.|q\.|tp\.)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleProvinceChange = async (code: string) => {
    setProvinceCode(code);
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);
    setIsFieldAutoFilled(prev => ({ ...prev, province: false, district: false, ward: false })); // Reset autofill status if user manually changes
    const res = await locationService.getDistricts(code);
    if (res.success && res.data) setDistricts(res.data);
  };

  const handleDistrictChange = async (code: string) => {
    setDistrictCode(code);
    setWardCode("");
    setWards([]);
    setIsFieldAutoFilled(prev => ({ ...prev, district: false, ward: false })); // Reset autofill status if user manually changes
    const res = await locationService.getWards(code);
    if (res.success && res.data) setWards(res.data);
  };

  const handleMapLocationSelect = async (loc: any) => {
    const requestId = ++lastRequestId.current;
    setIsAddressLoading(true);

    // Initial reset of selection codes to avoid showing wrong area mid-load
    setProvinceCode("");
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);
    setIsFieldAutoFilled({ province: false, district: false, ward: false });

    setMapLocation(loc);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // Update Detailed Address input immediately
      console.log('🗺️ Full location object:', JSON.stringify(loc, null, 2));
      console.log('📍 Raw address from map:', JSON.stringify(raw, null, 2));

      // 1. Fill street address with full formatted address (cleaned)
      let detailedAddress = loc.address || "";
      detailedAddress = detailedAddress
        .replace(/,?\s*Vi[eệ]t\s*Nam\s*/gi, '')
        .replace(/,?\s*\d{5,6}\s*/g, '')
        .trim();

      if (detailedAddress && detailedAddress !== "Đang xác định..." && detailedAddress !== "Đang xác định địa chỉ...") {
        setStreetAddress(detailedAddress);
        setTempAddress(detailedAddress);
      }

      // 2. Province/District/Ward Identification
      try {
        let provincesData = provinces;
        if (provincesData.length === 0) {
          const res = await locationService.getProvinces();
          if (res.success && res.data) {
            setProvinces(res.data);
            provincesData = res.data;
          }
        }

        // Check if this is still the latest request
        if (requestId !== lastRequestId.current) return;

        const provinceName = raw.province || raw.region || (raw.city && raw.city.includes("Thành phố") ? raw.city : "");
        let normProvince = normalizeLocationName(provinceName);

        let matchedProvince = null;
        if (normProvince && provincesData.length > 0) {
          matchedProvince = provincesData.find((p: any) => {
            const pNorm = normalizeLocationName(p.name);
            return normProvince.includes(pNorm) || pNorm.includes(normProvince);
          });
        }

        if (!matchedProvince && loc.address && provincesData.length > 0) {
          const normFullAddress = normalizeLocationName(loc.address);
          matchedProvince = provincesData.find((p: any) => normFullAddress.includes(normalizeLocationName(p.name)));
        }

        if (matchedProvince && requestId === lastRequestId.current) {
          setProvinceCode(matchedProvince.code);
          setIsFieldAutoFilled(prev => ({ ...prev, province: true }));
          const distRes = await locationService.getDistricts(matchedProvince.code);

          if (requestId !== lastRequestId.current) return;

          if (distRes.success && distRes.data) {
            setDistricts(distRes.data);
            const districtCandidates = [raw.district, raw.osm_city_district, raw.osm_town, raw.osm_city, raw.city].filter(Boolean);
            let matchedDistrict = null;
            for (const candidate of districtCandidates) {
              const normCand = normalizeLocationName(candidate);
              matchedDistrict = distRes.data.find((d: any) => {
                const dNorm = normalizeLocationName(d.name);
                return normCand.includes(dNorm) || dNorm.includes(normCand);
              });
              if (matchedDistrict) break;
            }

            if (!matchedDistrict && loc.address) {
              const normFullAddress = normalizeLocationName(loc.address);
              matchedDistrict = distRes.data.find((d: any) => normFullAddress.includes(normalizeLocationName(d.name)));
            }

            if (matchedDistrict && requestId === lastRequestId.current) {
              setDistrictCode(matchedDistrict.code);
              setIsFieldAutoFilled(prev => ({ ...prev, district: true }));
              const wardRes = await locationService.getWards(matchedDistrict.code);

              if (requestId !== lastRequestId.current) return;

              if (wardRes.success && wardRes.data) {
                setWards(wardRes.data);
                const wardCandidates = [raw.ward, raw.subdistrict, raw.osm_suburb, raw.osm_city_district].filter(Boolean);
                let matchedWard = null;
                for (const candidate of wardCandidates) {
                  const normCand = normalizeLocationName(candidate);
                  matchedWard = wardRes.data.find((w: any) => {
                    const wNorm = normalizeLocationName(w.name);
                    return normCand.includes(wNorm) || wNorm.includes(normCand);
                  });
                  if (matchedWard) break;
                }

                if (!matchedWard && loc.address) {
                  const normFullAddress = normalizeLocationName(loc.address);
                  matchedWard = wardRes.data.find((w: any) => normFullAddress.includes(normalizeLocationName(w.name)));
                }

                if (matchedWard && requestId === lastRequestId.current) {
                  setWardCode(matchedWard.code);
                  setIsFieldAutoFilled(prev => ({ ...prev, ward: true }));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in address matching:", err);
      }
    } else if (loc.address && loc.address !== "Đang xác định...") {
      setStreetAddress(loc.address);
      setTempAddress(loc.address);
    }

    if (requestId === lastRequestId.current) {
      setIsAddressLoading(false);
    }
  };

  const handleConfirmAddress = async () => {
    setIsAddressModalVisible(false);

    const isUnchanged = tempAddress.trim() === streetAddress.trim();
    if (isUnchanged) return;

    if (mapLocation && tempAddress.trim()) {
      setLoading(true);
      try {
        const selectedProvince = provinceOptions.find((p: any) => p.value === provinceCode)?.label;
        const selectedDistrict = districtOptions.find((d: any) => d.value === districtCode)?.label;
        const selectedWard = wardOptions.find((w: any) => w.value === wardCode)?.label;

        const fullAddressToGeocode = [
          tempAddress,
          selectedWard,
          selectedDistrict,
          selectedProvince
        ].filter(Boolean).join(', ');

        const geoResult = await locationService.geocodeAddress(fullAddressToGeocode, latitude, longitude);

        if (geoResult.success && geoResult.data) {
          const newLat = geoResult.data.latitude;
          const newLon = geoResult.data.longitude;
          const isFallback = geoResult.data.isFallback;

          const dist = locationService.haversineDistance(latitude, longitude, newLat, newLon);
          console.log(`📏 Computed distance while confirming: ${dist.toFixed(3)} km. Fallback: ${isFallback}`);

          if (isFallback) {
            // If OSM only found a broad match (e.g. ward/street center), DON'T move the pin
            // but update the text. This preserves the user's manual pin precision.
            setStreetAddress(tempAddress);
            setErrors({ ...errors, street: undefined });
            showAlert(
              "Đã cập nhật địa chỉ",
              "Hệ thống đã ghi nhận địa chỉ chữ của bạn. Vì dữ liệu bản đồ chưa có số nhà cụ thể này, chúng tôi sẽ giữ nguyên vị trí ghim hiện tại của bạn. Vui lòng kiểm tra lại ghim đã đúng vị trí nhà chưa.",
              "warning",
              [{ text: "Đã hiểu" }]
            );
            return;
          }

          if (dist > 2.0) {
            setLoading(false);
            showAlert(
              "Vị trí không hợp lệ",
              `Địa chỉ bạn nhập cách vị trí đã ghim ${dist.toFixed(1)}km (vượt quá giới hạn 2km). Vui lòng nhập địa chỉ gần vị trí đã ghim hơn.`,
              "error"
            );
            return;
          }

          // Allowed: Exact match (isFallback = false) & within 2km
          setStreetAddress(tempAddress);
          setErrors({ ...errors, street: undefined });
          setLatitude(newLat);
          setLongitude(newLon);
          setMapLocation({
            latitude: newLat,
            longitude: newLon,
            address: fullAddressToGeocode
          });

          showAlert("Xác nhận địa chỉ", "Đã cập nhật chi tiết địa chỉ và ghim lại bản đồ.", "success");
        } else {
          showAlert(
            "Không thể xác minh",
            "Hệ thống không thể xác định vị trí của địa chỉ này để kiểm tra khoảng cách. Vui lòng nhập rõ ràng hơn.",
            "error"
          );
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Derive options based on selections - fallback to mock if API fails
  const provinceOptions = provinces.length > 0
    ? provinces.map(p => ({ label: p.name, value: p.code }))
    : LOCATION_DATA.provinces as any;

  const districtOptions = districts.length > 0
    ? districts.map(d => ({ label: d.name, value: d.code }))
    : (provinceCode ? (LOCATION_DATA.districts[provinceCode] || []) : []) as any;

  const wardOptions = wards.length > 0
    ? wards.map(w => ({ label: w.name, value: w.code }))
    : (districtCode ? (LOCATION_DATA.wards[districtCode] || []) : []) as any;

  const addWasteItem = () => {
    const typeError = validateRequired(currentType, "Loại rác");
    const weightError = validateRequired(currentWeight, "Khối lượng");

    if (typeError || weightError || isNaN(parseFloat(currentWeight)) || parseFloat(currentWeight) <= 0) {
      setErrors({
        ...errors,
        type: typeError ?? undefined,
        weight: weightError || (isNaN(parseFloat(currentWeight)) || parseFloat(currentWeight) <= 0 ? t("createReport.weightInvalid") : undefined)
      });
      return;
    }

    const newItem: BackendWasteItem = {
      wasteType: currentType,
      weightKg: parseFloat(currentWeight),
    };

    setWasteItems([...wasteItems, newItem]);
    setCurrentType("ORGANIC");
    setCurrentWeight("");
    setErrors({ ...errors, type: undefined, weight: undefined, items: undefined });
  };

  const removeWasteItem = (index: number) => {
    setWasteItems(wasteItems.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: any = {};
    if (wasteItems.length === 0) {
      newErrors.items = t("createReport.wasteMissing");
    }

    if (!mapLocation) {
      newErrors.map = t("createReport.locationMissing");
      showAlert(t("createReport.locationTitle"), t("createReport.selectMapFirst"), "warning");
    }

    if (!streetAddress.trim()) {
      newErrors.street = t("createReport.addressMissing");
    }

    if (!provinceCode || !districtCode || !wardCode) {
      newErrors.location = t("createReport.locationUnclear");
      showAlert(t("createReport.locationUnclear"), t("createReport.locationUnclearMsg"), "warning");
    }

    setErrors({ ...errors, ...newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "Quyền truy cập",
          t("createReport.cameraPermission", { source: useCamera ? "camera" : "library" }),
          "error"
        );
        return;
      }

      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });

      if (!pickerResult.canceled) {
        const newImages = pickerResult.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("createReport.imageUploadError"));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(t("createReport.addPhotoSource"), t("createReport.chooseSource"), [
      {
        text: t("createReport.takePhoto"),
        onPress: () => handlePickImage(true),
      },
      {
        text: t("createReport.chooseFromLibrary"),
        onPress: () => handlePickImage(false),
      },
      {
        text: t("common.cancel"),
        style: "cancel",
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      // Construct full address first so we can geocode it accurately
      const selectedProvince = provinceOptions.find((p: { label: string, value: string }) => p.value === provinceCode)?.label;
      const selectedDistrict = districtOptions.find((d: { label: string, value: string }) => d.value === districtCode)?.label;
      const selectedWard = wardOptions.find((w: { label: string, value: string }) => w.value === wardCode)?.label;

      const fullAddress = [
        streetAddress,
        selectedWard,
        selectedDistrict,
        selectedProvince
      ].filter(Boolean).join(', ');

      // 3. Validation via geocoding on submit: Ensure the pinned map coordinates
      // match the selected address within a reasonable distance (2km).
      if (mapLocation && fullAddress) {
        // Geocode the full address to get its actual coordinates
        const geoResult = await locationService.geocodeAddress(fullAddress, latitude, longitude);

        if (geoResult.success && geoResult.data) {
          const dist = locationService.haversineDistance(
            latitude,
            longitude,
            geoResult.data.latitude,
            geoResult.data.longitude
          );

          console.log(`📏 CreateReport validation distance: ${dist.toFixed(3)} km`);

          // If mismatch is more than 2km, warn user
          if (dist > 2.0) {
            setLoading(false);
            showAlert(
              t("createReport.locationMismatch"),
              `Vị trí ghim và địa chỉ bạn chọn cách nhau ${dist.toFixed(1)}km (vượt quá giới hạn 2km). Vui lòng ghim bản đồ hoặc chọn khu vực khớp nhau hơn để tránh gian lận.`,
              "warning"
            );
            return;
          }
        }
      }

      const reportData: any = {
        address: fullAddress || streetAddress,
        latitude: latitude,
        longitude: longitude,
        provinceCode: provinceCode || "",
        districtCode: districtCode || "",
        wardCode: wardCode || "",
        description: description,
        wasteItems: wasteItems.map((item) => ({
          wasteType: item.wasteType,
          weightKg: item.weightKg,
        })),
        files: images,
      };

      console.log('🚀 Sending Report Data:', JSON.stringify(reportData, null, 2));
      const response = await wasteService.createReport(reportData);
      console.log('📥 Server Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        // Assuming response.data contains the created report object with an id
        const newReportId = response.data?.id;

        Alert.alert(
          t("common.success"),
          t("createReport.submitSuccess"),
          [
            {
              text: t("createReport.viewDetail"),
              onPress: () => {
                if (newReportId) {
                  router.replace({
                    pathname: "/report-detail",
                    params: { id: newReportId }
                  });
                } else {
                  router.replace("/(citizen)/history");
                }
              },
            },
            {
              text: t("createReport.goToList"),
              onPress: () => router.replace("/(citizen)/history"),
            },
          ]
        );

        setWasteItems([]);
        setDescription("");
        setImages([]);
        setErrors({});
      } else {
        Alert.alert(t("common.error"), response.error || t("createReport.submitError"));
      }
    } catch (error) {
      console.error("Submit report error:", error);
      Alert.alert(t("common.error"), t("createReport.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = wasteItems.reduce((sum, item) => sum + item.weightKg, 0);
  const estimatedPoints = wasteItems.reduce((sum, item) => {
    const typeInfo = WASTE_TYPES.find((t: any) => t.value === item.wasteType);
    return sum + (item.weightKg * (typeInfo?.points || 10));
  }, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title={t("createReport.title")}
        subtitle={t("createReport.subtitle")}
        showBack={true}
      />

      <View style={styles.content}>
        {/* Location Section with Enhanced UX */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("createReport.pickupAddress")}</Text>

          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={styles.loadingText}>{t("createReport.gettingLocation")}</Text>
            </View>
          )}

          <MapLocationPicker
            label={t("createReport.selectLocation")}
            onLocationSelect={handleMapLocationSelect}
            initialLocation={mapLocation ? { latitude: mapLocation.latitude, longitude: mapLocation.longitude } : undefined}
          />

          {mapLocation && (() => {
            const wardLabel = wardOptions.find((w: any) => w.value === wardCode)?.label;
            const districtLabel = districtOptions.find((d: any) => d.value === districtCode)?.label;
            const provinceLabel = provinceOptions.find((p: any) => p.value === provinceCode)?.label;

            console.log('Display card - Codes:', { provinceCode, districtCode, wardCode });
            console.log('Display card - Labels:', { provinceLabel, districtLabel, wardLabel });
            console.log('Display card - Options counts:', {
              provinces: provinceOptions.length,
              districts: districtOptions.length,
              wards: wardOptions.length
            });

            const locationText = [wardLabel, districtLabel, provinceLabel]
              .filter(Boolean)
              .join(", ") || t("createReport.detectingArea");

            return (
              <View style={styles.addressDisplayCard}>
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={20} color={AppColors.primary} />
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{t("createReport.region")}</Text>
                    {isAddressLoading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                        <ActivityIndicator size="small" color={AppColors.primary} />
                        <Text style={[styles.fullAddressText, { marginLeft: 8, color: AppColors.gray[500] }]}>
                          Đang tải khu vực...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.fullAddressText}>
                        {locationText}
                      </Text>
                    )}

                    <View style={styles.manualSelection}>
                      <Picker
                        label={t("createReport.province")}
                        placeholder={t("createReport.selectProvince")}
                        options={provinceOptions}
                        selectedValue={provinceCode}
                        onValueChange={handleProvinceChange}
                        disabled={isFieldAutoFilled.province}
                        error={errors.province}
                      />
                      <Picker
                        label={t("createReport.district")}
                        placeholder={t("createReport.selectDistrict")}
                        options={districtOptions}
                        selectedValue={districtCode}
                        onValueChange={handleDistrictChange}
                        disabled={isFieldAutoFilled.district}
                        error={errors.district}
                      />
                      <Picker
                        label={t("createReport.ward")}
                        placeholder={t("createReport.selectWard")}
                        options={wardOptions}
                        selectedValue={wardCode}
                        onValueChange={setWardCode}
                        disabled={isFieldAutoFilled.ward}
                        error={errors.ward}
                      />
                    </View>

                    {(wardCode && districtCode && provinceCode) ? (
                      <View style={styles.confirmedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={AppColors.success} />
                        <Text style={styles.confirmedText}>
                          {t("createReport.locationConfirmed")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })()}

          <Text style={styles.sectionTitle}>{t("createReport.detailedAddress")}</Text>
          <Card variant="elevated" style={styles.locationCard}>
            <TouchableOpacity onPress={() => { setTempAddress(streetAddress); setIsAddressModalVisible(true); }} activeOpacity={0.7}>
              <View pointerEvents="none">
                <Input
                  label={t("createReport.streetPlaceholder")}
                  placeholder={t("createReport.streetAutoFill")}
                  value={streetAddress}
                  onChangeText={(text: string) => {
                    setStreetAddress(text);
                    setErrors({ ...errors, street: undefined });
                  }}
                  editable={false}
                  multiline={true}
                  numberOfLines={3}
                  error={errors.street}
                  icon="location-outline"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Waste Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("createReport.wasteList")}</Text>
          {wasteItems.length > 0 ? (
            <View style={styles.itemsList}>
              {(() => {
                // Group waste items by type and sum weights
                const grouped = wasteItems.reduce((acc, item) => {
                  const existing = acc.find(i => i.wasteType === item.wasteType);
                  if (existing) {
                    existing.weightKg += item.weightKg;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [] as BackendWasteItem[]);

                return grouped.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {getWasteTypeLabel(item.wasteType)}
                      </Text>
                      <Text style={styles.itemWeight}>{item.weightKg.toFixed(1)} kg</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                      // Remove all items of this type
                      setWasteItems(wasteItems.filter(i => i.wasteType !== item.wasteType));
                    }}>
                      <Ionicons name="trash-outline" size={20} color={AppColors.error} />
                    </TouchableOpacity>
                  </View>
                ));
              })()}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t("createReport.total")}</Text>
                <Text style={styles.totalValue}>{totalWeight.toFixed(1)} kg</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>{t("createReport.noWaste")}</Text>
            </View>
          )}
          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
        </View>

        {/* Add New Waste Item */}
        <Card variant="outlined" style={styles.addCard}>
          <Text style={styles.addTitle}>{t("createReport.addWaste")}</Text>

          <WasteTypeSelector
            selectedType={currentType}
            onSelect={(value) => {
              setCurrentType(value);
              setErrors({ ...errors, type: undefined });
            }}
          />
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

          <View style={styles.weightInputContainer}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder={t("createReport.weightPlaceholder")}
                value={currentWeight}
                onChangeText={(text) => {
                  setCurrentWeight(text);
                  setErrors({ ...errors, weight: undefined });
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={AppColors.gray[400]}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addWasteItem}>
              <Ionicons name="add" size={24} color={AppColors.white} />
              <Text style={styles.addButtonText}>{t("createReport.add")}</Text>
            </TouchableOpacity>
          </View>
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
        </Card>

        {/* {estimatedPoints > 0 && (
          <View style={styles.pointsEstimate}>
            <Text style={styles.estimateLabel}>Điểm dự kiến:</Text>
            <Text style={styles.estimateValue}>+{Math.round(estimatedPoints)} điểm</Text>
          </View>
        )} */}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("createReport.description")}</Text>
          <Input
            placeholder={t("createReport.descriptionPlaceholder")}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("createReport.photos")}</Text>
          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={AppColors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
              >
                <Ionicons name="camera" size={32} color={AppColors.primary} />
                <Text style={styles.addImageText}>{t("createReport.addPhoto")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {images.length > 0 && (
          <Text style={styles.imageCount}>{images.length}/5 ảnh</Text>
        )}

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="bulb" size={24} color={AppColors.warning} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>{t("createReport.note")}</Text>
              <Text style={styles.infoText}>
                {t("createReport.noteText")}
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title={t("createReport.submit")}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </View>

      {/* Address Edit Modal */}
      <Modal
        visible={isAddressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("createReport.detailedAddress")}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempAddress}
              onChangeText={setTempAddress}
              placeholder={t("createReport.streetPlaceholder")}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsAddressModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmAddress}
              >
                <Text style={styles.modalButtonTextConfirm}>{t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Global Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  addressDisplayCard: {
    backgroundColor: AppColors.primary + "10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  fullAddressText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
    fontWeight: "600",
  },
  required: {
    color: AppColors.error,
  },
  locationCard: {
    padding: 16,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  districtText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    paddingRight: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  inputUnit: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 12,
    marginTop: 5,
  },
  pointsEstimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    backgroundColor: AppColors.warning + "20",
    borderRadius: 12,
  },
  estimateLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: AppColors.gray[200],
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.primary + "10",
  },
  addImageText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  imageCount: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: "right",
  },
  itemsList: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  itemWeight: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  emptyItems: {
    padding: 20,
    alignItems: "center",
    backgroundColor: AppColors.gray[100],
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  emptyItemsText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  addCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: AppColors.white,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 15,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    gap: 4,
  },
  addButtonText: {
    color: AppColors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 25,
    backgroundColor: AppColors.secondary + "10",
  },
  infoContent: {
    flexDirection: "row",
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary + "10",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "600",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  confirmedText: {
    fontSize: 12,
    color: AppColors.success,
    fontWeight: "600",
  },
  manualSelection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: AppColors.primary + "20",
  },
  wardHintBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
    backgroundColor: AppColors.warning + "15",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  wardHintText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: "600",
    flex: 1,
  },
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: AppColors.primary + '15',
    alignSelf: 'flex-end',
  },
  validateBtnText: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: AppColors.gray[200],
  },
  modalButtonConfirm: {
    backgroundColor: AppColors.primary,
  },
  modalButtonTextCancel: {
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: AppColors.white,
    fontWeight: "600",
  },
});
