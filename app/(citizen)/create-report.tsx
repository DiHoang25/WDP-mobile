import { Button, Card, Header, Input, MapLocationPicker } from "@/components/common";
import { WasteTypeSelector } from "@/components/waste";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATION_DATA, WASTE_TYPES } from "@/data/mockData";
import { District, locationService, Province, Ward } from "@/services/location.service";
import { wasteService } from "@/services/waste.service";
import { BackendWasteItem } from "@/types";
import { getWasteTypeLabel } from "@/utils/helpers";
import { validateRequired } from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ExpoLocation from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function CreateReportScreen() {
  const { user } = useAuth();
  const [wasteItems, setWasteItems] = useState<BackendWasteItem[]>([]);
  const [currentType, setCurrentType] = useState("");
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

  useEffect(() => {
    loadProvinces();
    askToUseCurrentLocation();
  }, []);

  const loadProvinces = async () => {
    const res = await locationService.getProvinces();
    if (res.success && res.data) setProvinces(res.data);
  };

  const askToUseCurrentLocation = () => {
    Alert.alert(
      "Vị trí",
      "Bạn có muốn sử dụng vị trí hiện tại của mình để tạo báo cáo không?",
      [
        {
          text: "Có, lấy vị trí hiện tại",
          onPress: getCurrentLocation
        },
        {
          text: "Không, tôi tự chọn",
          style: "cancel"
        }
      ]
    );
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Lỗi", "Quyền truy cập vị trí bị từ chối.");
        return;
      }

      setLoading(true);

      // Fast path: try last known position first for instant UI response
      const lastKnown = await ExpoLocation.getLastKnownPositionAsync();
      if (lastKnown) {
        const coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setMapLocation({ ...coords, address: "Đang xác định..." });
      }

      // Precise path: get fresh location with balanced accuracy (faster than High)
      let location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
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
      const results = await ExpoLocation.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        const res = results[0];
        const formattedAddress = [res.name, res.street, res.district, res.city].filter(Boolean).join(", ");

        const normalized = {
          city: res.city || res.region || "",
          district: res.district || res.subregion || "",
          ward: res.subregion || res.street || res.name || "",
          street: res.street || res.name || "",
          region: res.region || res.city || "",
          name: res.name || ""
        };

        handleMapLocationSelect({
          ...coords,
          address: formattedAddress,
          rawAddress: normalized
        });

        // Explicitly set street address for Input field inside create-report state
        const inputAddr = [res.name, res.street].filter(Boolean).join(", ");
        if (inputAddr) setStreetAddress(inputAddr);
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
      .replace(/^(tỉnh|thành phố|thành phồ|quận|huyện|thị xã|phường|xã|thị trấn|p\.|q\.)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleMapLocationSelect = async (loc: any) => {
    setMapLocation(loc);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // Update Detailed Address input immediately
      // Combine name (e.g. building name) and street for a better detailed address
      const mainAddress = [raw.name, raw.street].filter(Boolean).join(", ");
      if (mainAddress) {
        setStreetAddress(mainAddress);
      } else if (loc.address && loc.address !== "Đang xác định...") {
        // Fallback to the formatted address if street fields are missing
        setStreetAddress(loc.address.split(',')[0].trim());
      }

      const provinceName = raw.region || raw.city || "";
      const normProvince = normalizeLocationName(provinceName);
      if (normProvince && provinces.length > 0) {
        const matchedProvince = provinces.find((p: any) => {
          const pNorm = normalizeLocationName(p.name);
          return normProvince.includes(pNorm) || pNorm.includes(normProvince);
        });

        if (matchedProvince) {
          setProvinceCode(matchedProvince.code);
          const distRes = await locationService.getDistricts(matchedProvince.code);
          if (distRes.success && distRes.data) {
            setDistricts(distRes.data);
            const districtName = raw.district || "";
            const normDistrict = normalizeLocationName(districtName);
            const matchedDistrict = distRes.data.find((d: any) => {
              const dNorm = normalizeLocationName(d.name);
              return normDistrict.includes(dNorm) || dNorm.includes(normDistrict);
            });

            if (matchedDistrict) {
              setDistrictCode(matchedDistrict.code);
              const wardRes = await locationService.getWards(matchedDistrict.code);
              if (wardRes.success && wardRes.data) {
                setWards(wardRes.data);
                const wardName = raw.ward || raw.subdistrict || "";
                const normWard = normalizeLocationName(wardName);
                const matchedWard = wardRes.data.find((w: any) => {
                  const wNorm = normalizeLocationName(w.name);
                  return normWard.includes(wNorm) || wNorm.includes(normWard);
                });
                if (matchedWard) setWardCode(matchedWard.code);
              }
            }
          }
        }
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
        weight: weightError || (isNaN(parseFloat(currentWeight)) || parseFloat(currentWeight) <= 0 ? "Khối lượng phải lớn hơn 0" : undefined)
      });
      return;
    }

    const newItem: BackendWasteItem = {
      wasteType: currentType,
      weight: parseFloat(currentWeight),
    };

    setWasteItems([...wasteItems, newItem]);
    setCurrentType("");
    setCurrentWeight("");
    setErrors({ ...errors, type: undefined, weight: undefined, items: undefined });
  };

  const removeWasteItem = (index: number) => {
    setWasteItems(wasteItems.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: any = {};
    if (wasteItems.length === 0) {
      newErrors.items = "Vui lòng thêm ít nhất một loại rác";
    }

    if (!mapLocation) {
      newErrors.map = "Vui lòng chọn vị trí trên bản đồ";
      Alert.alert("Vị trí", "Vui lòng chọn hoặc ghim vị trí rác trên bản đồ.");
    }

    if (!streetAddress.trim()) {
      newErrors.street = "Vui lòng nhập địa chỉ cụ thể hoặc chọn vị trí trên bản đồ";
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
        Alert.alert(
          "Quyền truy cập",
          `Vui lòng cấp quyền truy cập ${useCamera ? "camera" : "thư viện ảnh"} để tải ảnh lên.`,
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
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert("Thêm ảnh", "Chọn nguồn ảnh", [
      {
        text: "Chụp ảnh",
        onPress: () => handlePickImage(true),
      },
      {
        text: "Chọn từ thư viện",
        onPress: () => handlePickImage(false),
      },
      {
        text: "Hủy",
        style: "cancel",
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const selectedProvince = provinceOptions.find((p: any) => p.value === provinceCode)?.label;
      const selectedDistrict = districtOptions.find((d: any) => d.value === districtCode)?.label;
      const selectedWard = wardOptions.find((w: any) => w.value === wardCode)?.label;

      const fullAddress = [
        streetAddress,
        selectedWard,
        selectedDistrict,
        selectedProvince
      ].filter(Boolean).join(', ');

      const reportData: any = {
        address: fullAddress || streetAddress,
        latitude: latitude,
        longitude: longitude,
        provinceCode: provinceCode || "",
        districtCode: districtCode || "",
        wardCode: wardCode || "",
        description: description,
        wasteItems: wasteItems.map((item) => ({
          wasteType: item.wasteType.toUpperCase(),
          weight: item.weight,
        })),
        files: images,
      };

      const response = await wasteService.createReport(reportData);

      if (response.success) {
        Alert.alert(
          "Thành công!",
          "Báo cáo đã được gửi (Status: Pending).",
          [
            {
              text: "Xem lịch sử",
              onPress: () => router.replace("/(citizen)/history"),
            },
            {
              text: "Tạo thêm",
              onPress: () => {
                setWasteItems([]);
                setDescription("");
                setImages([]);
                setErrors({});
              },
            },
          ]
        );
      } else {
        Alert.alert("Lỗi", response.error || "Không thể gửi báo cáo.");
      }
    } catch (error) {
      console.error("Submit report error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = wasteItems.reduce((sum, item) => sum + item.weight, 0);
  const estimatedPoints = wasteItems.reduce((sum, item) => {
    const typeInfo = WASTE_TYPES.find((t: any) => t.value === item.wasteType);
    return sum + (item.weight * (typeInfo?.points || 10));
  }, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Tạo báo cáo rác"
        subtitle="Có thể thêm nhiều loại rác vào một báo cáo"
        showBack={false}
      />

      <View style={styles.content}>
        {/* Address Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vị trí rác</Text>
          <MapLocationPicker
            label="Chọn vị trí chính xác trên bản đồ"
            onLocationSelect={handleMapLocationSelect}
            initialLocation={mapLocation ? { latitude: mapLocation.latitude, longitude: mapLocation.longitude } : undefined}
          />
          {mapLocation && (
            <View style={styles.addressDisplayCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={20} color={AppColors.primary} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Khu vực đã xác định:</Text>
                  <Text style={styles.fullAddressText}>
                    {[
                      wardOptions.find((w: any) => w.value === wardCode)?.label,
                      districtOptions.find((d: any) => d.value === districtCode)?.label,
                      provinceOptions.find((p: any) => p.value === provinceCode)?.label
                    ].filter(Boolean).join(", ") || "Đang xác định khu vực..."}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <Text style={styles.sectionTitle}>Địa chỉ chi tiết</Text>
          <Card variant="elevated" style={styles.locationCard}>
            <Input
              label="Số nhà, ngõ, tên đường..."
              placeholder="Nhập địa chỉ chi tiết"
              value={streetAddress}
              onChangeText={(text: string) => setStreetAddress(text)}
              error={errors.street}
              icon="location-outline"
            />
          </Card>
        </View>

        {/* Waste Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách rác đã thêm</Text>
          {wasteItems.length > 0 ? (
            <View style={styles.itemsList}>
              {wasteItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {getWasteTypeLabel(item.wasteType)}
                    </Text>
                    <Text style={styles.itemWeight}>{item.weight} kg</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeWasteItem(index)}>
                    <Ionicons name="trash-outline" size={20} color={AppColors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalValue}>{totalWeight.toFixed(1)} kg</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Chưa có loại rác nào được thêm</Text>
            </View>
          )}
          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
        </View>

        {/* Add New Waste Item */}
        <Card variant="outlined" style={styles.addCard}>
          <Text style={styles.addTitle}>Thêm loại rác</Text>

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
                placeholder="Khối lượng (kg)"
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
              <Text style={styles.addButtonText}>Thêm</Text>
            </TouchableOpacity>
          </View>
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
        </Card>

        {estimatedPoints > 0 && (
          <View style={styles.pointsEstimate}>
            <Text style={styles.estimateLabel}>Điểm dự kiến:</Text>
            <Text style={styles.estimateValue}>+{Math.round(estimatedPoints)} điểm</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả (tùy chọn)</Text>
          <Input
            placeholder="Ví dụ: Chai nhựa đã rửa sạch, xếp gọn..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh minh họa</Text>
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
                <Text style={styles.addImageText}>Thêm ảnh</Text>
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
              <Text style={styles.infoTitle}>Lưu ý:</Text>
              <Text style={styles.infoText}>
                • Phân loại rác đúng loại để nhận thêm điểm{"\n"}• Rửa sạch và
                để khô trước khi đóng gói{"\n"}• Chụp ảnh rõ ràng giúp shipper
                dễ xác nhận{"\n"}• Shipper sẽ đến trong 24-48 giờ
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title="Tạo báo cáo"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </View>
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
});
