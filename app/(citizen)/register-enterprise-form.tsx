import { Button, GroupedServiceAreaPicker, Header, Input, MapLocationPicker, MultiSelectPicker, Picker, WasteTypeMultiSelector } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { District, locationService, Province, Ward } from "@/services/location.service";
import { WasteType } from '@/types';
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function RegisterEnterpriseFormScreen() {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const backFallbackRoute =
    source === "profile" ? "/(citizen)/profile" : "/(citizen)";
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");

  // Location dynamic data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<(District & { provinceName?: string; provinceCode?: string })[]>([]);
  const [wards, setWards] = useState<(Ward & { districtName?: string; districtCode?: string; provinceCode?: string })[]>([]);

  // General address location (for enterprise address)
  const [addressProvinceId, setAddressProvinceId] = useState("");
  const [addressDistrictId, setAddressDistrictId] = useState("");
  const [addressWardId, setAddressWardId] = useState("");
  const [addressDistricts, setAddressDistricts] = useState<District[]>([]);
  const [addressWards, setAddressWards] = useState<Ward[]>([]);

  // Service area location selection - NOW MULTI-SELECT (arrays)
  const [serviceProvinceIds, setServiceProvinceIds] = useState<string[]>([]);
  const [serviceDistrictIds, setServiceDistrictIds] = useState<string[]>([]);
  const [serviceWardIds, setServiceWardIds] = useState<string[]>([]);


  // Waste types selection
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<WasteType[]>([]);

  const [errors, setErrors] = useState<any>({});

  // Map location for enterprise address
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    rawAddress?: any;
  } | null>(null);

  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const [isFieldAutoFilled, setIsFieldAutoFilled] = useState({ province: false, district: false, ward: false });
  const lastRequestId = React.useRef(0);

  // Helper to normalize and compare Vietnamese location names
  const normalizeLocationName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/^(tinh|thanh pho|thanh pho|quan|huyen|thi xa|phuong|xa|thi tran|p\.|q\.)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Auto-fill address elements when map location is selected
  const handleMapLocationSelect = async (loc: any) => {
    const requestId = ++lastRequestId.current;
    setLoading(true);

    // Initial reset
    setAddressProvinceId("");
    setAddressDistrictId("");
    setAddressWardId("");
    setAddressDistricts([]);
    setAddressWards([]);
    setIsFieldAutoFilled({ province: false, district: false, ward: false });

    setMapLocation(loc);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // 1. Fill detailed address (street level only)
      let detailedAddress = loc.address || "";
      detailedAddress = detailedAddress
        .replace(/,?\s*Vi[eệ]t\s*Nam\s*/gi, '')
        .replace(/,?\s*\d{5,6}\s*/g, '')
        .trim();

      if (detailedAddress && detailedAddress !== "Đang xác định..." && detailedAddress !== "Đang xác định địa chỉ...") {
        setAddress(detailedAddress);
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

        if (requestId !== lastRequestId.current) return;

        // SPECIAL CORRECTION: Handle Thu Duc / HCM 
        const rawJson = JSON.stringify(raw).toLowerCase();
        const hasThuDuc = rawJson.includes("thu duc") || (loc.address && loc.address.toLowerCase().includes("thu duc"));
        const hasHCM = rawJson.includes("ho chi minh") || rawJson.includes("hcm") ||
          (loc.address && (loc.address.toLowerCase().includes("ho chi minh") || loc.address.toLowerCase().includes("hcm")));

        let searchProvince = raw.province || raw.region || (hasHCM ? "Thành phố Hồ Chí Minh" : "");
        let searchDistrict = raw.district || raw.osm_city_district || raw.osm_town || raw.city || "";
        let searchWard = raw.ward || raw.osm_suburb || raw.suburb || "";

        if (hasThuDuc) {
          searchProvince = "Thành phố Hồ Chí Minh";
          searchDistrict = "Thành phố Thủ Đức";
        }

        // A. MATCH PROVINCE (79 for HCMC)
        let matchedProvince = null;
        let normProvince = normalizeLocationName(searchProvince);

        if (normProvince && provincesData.length > 0) {
          matchedProvince = provincesData.find((p: any) => normalizeLocationName(p.name) === normProvince);
        }

        if (matchedProvince) {
          setAddressProvinceId(matchedProvince.code);
          setIsFieldAutoFilled(prev => ({ ...prev, province: true }));

          // B. MATCH DISTRICT
          const distRes = await locationService.getDistricts(matchedProvince.code);
          if (distRes.success && distRes.data && requestId === lastRequestId.current) {
            setAddressDistricts(distRes.data);

            const districtCandidates = [
              searchDistrict,
              raw.osm_city_district,
              hasThuDuc ? "Thành phố Thủ Đức" : "",
              raw.osm_town,
              raw.city,
              raw.name,
            ].filter(c => !!c && normalizeLocationName(c) !== normProvince);

            let matchedDistrict = null;
            for (const cand of districtCandidates) {
              const normCand = normalizeLocationName(cand);
              matchedDistrict = distRes.data.find((d: any) => normalizeLocationName(d.name) === normCand);
              if (matchedDistrict) break;
            }

            if (matchedDistrict) {
              setAddressDistrictId(matchedDistrict.code);
              setIsFieldAutoFilled(prev => ({ ...prev, district: true }));

              // C. MATCH WARD
              const wardRes = await locationService.getWards(matchedDistrict.code);
              if (wardRes.success && wardRes.data && requestId === lastRequestId.current) {
                setAddressWards(wardRes.data);

                const wardCandidates = [
                  searchWard,
                  raw.osm_suburb,
                  raw.suburb,
                  raw.street,
                  raw.name
                ].filter(c => !!c && normalizeLocationName(c) !== normalizeLocationName(matchedDistrict?.name || ""));

                let matchedWard = null;
                for (const cand of wardCandidates) {
                  const normCand = normalizeLocationName(cand);
                  matchedWard = wardRes.data.find((w: any) => {
                    const wNorm = normalizeLocationName(w.name);
                    return wNorm.includes(normCand) || normCand.includes(wNorm);
                  });
                  if (matchedWard) break;
                }

                if (matchedWard) {
                  setAddressWardId(matchedWard.code);
                  setIsFieldAutoFilled(prev => ({ ...prev, ward: true }));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Auto-match location error:", err);
      }
    } else if (loc.address && loc.address !== "Đang xác định...") {
      setAddress(loc.address);
    }

    if (requestId === lastRequestId.current) {
      setLoading(false);
    }
  };

  const handleConfirmAddress = async () => {
    setIsAddressModalVisible(false);

    const isUnchanged = tempAddress.trim() === address.trim();
    if (isUnchanged) return;

    if (mapLocation && tempAddress.trim()) {
      setLoading(true);
      try {
        const selectedProvince = provinces.find(p => p.code === addressProvinceId);
        const selectedDistrict = addressDistricts.find(d => d.code === addressDistrictId);
        const selectedWard = addressWards.find(w => w.code === addressWardId);

        const fullAddressToGeocode = [
          tempAddress,
          selectedWard?.name,
          selectedDistrict?.name,
          selectedProvince?.name
        ].filter(Boolean).join(', ');

        const geoResult = await locationService.geocodeAddress(fullAddressToGeocode, mapLocation.latitude, mapLocation.longitude);

        if (geoResult.success && geoResult.data) {
          const newLat = geoResult.data.latitude;
          const newLon = geoResult.data.longitude;
          const isFallback = geoResult.data.isFallback;

          const dist = locationService.haversineDistance(
            mapLocation.latitude,
            mapLocation.longitude,
            newLat,
            newLon
          );
          console.log(`📏 Computed distance while confirming: ${dist.toFixed(3)} km. Fallback: ${isFallback}`);

          if (isFallback) {
            showAlert(
              "Địa chỉ không cụ thể",
              "Hệ thống chỉ tìm thấy khu vực (Phường) của địa chỉ này mà không thấy số nhà/tên đường cụ thể. Vui lòng ghim trực tiếp trên bản đồ để đảm bảo chính xác nhất.",
              [
                { text: "Để tôi ghim lại", style: "cancel" },
                {
                  text: "Dùng tạm vị trí này",
                  onPress: () => {
                    if (dist > 2.0) {
                      showAlert("Lỗi", "Vị trí khu vực này quá xa điểm đã ghim (>2km). Vui lòng ghim lại.");
                      return;
                    }
                    setAddress(tempAddress);
                    setMapLocation({
                      latitude: newLat,
                      longitude: newLon,
                      address: fullAddressToGeocode
                    });
                  }
                }
              ]
            );
            return;
          }

          if (dist > 2.0) {
            setLoading(false);
            showAlert(
              "Vị trí không hợp lệ",
              `Địa chỉ bạn nhập cách vị trí đã ghim ${dist.toFixed(1)}km (vượt quá giới hạn 2km). Vui lòng nhập địa chỉ gần vị trí đã ghim hơn.`
            );
            return;
          }

          // Allowed: Update text & re-pin
          setAddress(tempAddress);
          setErrors({ ...errors, address: undefined });
          setMapLocation({
            latitude: newLat,
            longitude: newLon,
            address: fullAddressToGeocode
          });

          showAlert("Xác nhận địa chỉ", "Đã cập nhật chi tiết địa chỉ và ghim lại bản đồ.");
        } else {
          showAlert(
            "Không thể xác minh",
            "Hệ thống không thể xác định vị trí của địa chỉ này để kiểm tra khoảng cách. Vui lòng nhập rõ ràng hơn."
          );
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  // Service area multi-select: Load districts when provinces selected
  useEffect(() => {
    if (serviceProvinceIds.length > 0) {
      // Load districts for all selected provinces
      const loadAllDistricts = async () => {
        const allDistrictsData = await Promise.all(
          serviceProvinceIds.map(async pid => {
            const province = provinces.find(p => p.code === pid);
            const res = await locationService.getDistricts(pid);
            const districtsRes = (res.success && res.data) ? res.data : [];
            return districtsRes.map(d => ({ ...d, provinceName: province?.name, provinceCode: pid }));
          })
        );
        // Flatten and deduplicate
        const uniqueDistricts = Array.from(
          new Map(
            allDistrictsData.flat().map(d => [d.code, d])
          ).values()
        ).sort((a, b) => (a.provinceName || "").localeCompare(b.provinceName || ""));
        setDistricts(uniqueDistricts);
      };
      loadAllDistricts();
    } else {
      setDistricts([]);
      setServiceDistrictIds([]);
      setWards([]);
      setServiceWardIds([]);
    }
  }, [serviceProvinceIds]);

  // Service area multi-select: Load wards when districts selected
  useEffect(() => {
    if (serviceDistrictIds.length > 0) {
      const loadAllWards = async () => {
        const allWardsData = await Promise.all(
          serviceDistrictIds.map(async did => {
            const district = districts.find(d => d.code === did);
            const res = await locationService.getWards(did);
            const wardsRes = (res.success && res.data) ? res.data : [];
            return wardsRes.map(w => ({
              ...w,
              districtName: district?.name,
              districtCode: did,
              provinceCode: district?.provinceCode
            }));
          })
        );
        // Flatten and deduplicate
        const uniqueWards = Array.from(
          new Map(
            allWardsData.flat().map(w => [w.code, w])
          ).values()
        ).sort((a, b) => (a.districtName || "").localeCompare(b.districtName || ""));
        setWards(uniqueWards);
      };
      loadAllWards();
    } else {
      setWards([]);
      setServiceWardIds([]);
    }
  }, [serviceDistrictIds]);

  // General address location effects
  useEffect(() => {
    if (addressProvinceId) {
      loadAddressDistricts(addressProvinceId);
    } else {
      setAddressDistricts([]);
      setAddressDistrictId("");
      setAddressWards([]);
      setAddressWardId("");
    }
  }, [addressProvinceId]);

  useEffect(() => {
    if (addressDistrictId) {
      loadAddressWards(addressDistrictId);
    } else {
      setAddressWards([]);
      setAddressWardId("");
    }
  }, [addressDistrictId]);

  const loadProvinces = async () => {
    const res = await locationService.getProvinces();
    if (res.success && res.data) setProvinces(res.data);
  };

  const loadDistricts = async (id: string): Promise<District[]> => {
    const res = await locationService.getDistricts(id);
    return (res.success && res.data) ? res.data : [];
  };

  const loadWards = async (id: string): Promise<Ward[]> => {
    const res = await locationService.getWards(id);
    return (res.success && res.data) ? res.data : [];
  };

  // General address location loaders
  const loadAddressDistricts = async (id: string) => {
    const res = await locationService.getDistricts(id);
    if (res.success && res.data) setAddressDistricts(res.data);
  };

  const loadAddressWards = async (id: string) => {
    const res = await locationService.getWards(id);
    if (res.success && res.data) setAddressWards(res.data);
  };

  const nextStep = () => {
    // Basic validation
    const newErrors: any = {};
    if (!name) newErrors.name = t("registerEnterprise.nameRequired");
    if (!address) newErrors.address = t("registerEnterprise.addressRequired");
    if (!capacity || isNaN(parseFloat(capacity))) newErrors.capacity = t("registerEnterprise.capacityInvalid");

    if (!mapLocation) {
      newErrors.mapLocation = t("registerEnterprise.mapRequired");
    }


    // Validate service areas - require at least one selection
    if (serviceProvinceIds.length === 0) {
      newErrors.serviceArea = t("registerEnterprise.serviceAreaRequired");
    }

    // Validate waste types
    if (selectedWasteTypes.length === 0) {
      newErrors.wasteTypes = t("registerEnterprise.wasteTypesRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build full address from selections
    const selectedProvince = provinces.find(p => p.code === addressProvinceId);
    const selectedDistrict = addressDistricts.find(d => d.code === addressDistrictId);
    const selectedWard = addressWards.find(w => w.code === addressWardId);

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      setErrors({ ...newErrors, mapLocation: "Vui lòng chọn đầy đủ Tỉnh/Huyện/Phường" });
      return;
    }

    const fullAddress = [
      address, // detailed address
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name
    ].filter(Boolean).join(', ');

    // Build structured service areas with hierarchical logic
    const formattedServiceAreas: any[] = [];

    // Logic: For each selected district, check if it has specific wards selected
    // - If YES: return entries for each ward (provinceCode, districtCode, wardCode)
    // - If NO: return one entry for entire district (provinceCode, districtCode, wardCode: null)
    // - If only provinces selected (no districts): return province-level entries

    if (serviceDistrictIds.length > 0) {
      // Process each selected district
      serviceDistrictIds.forEach(districtId => {
        const district = districts.find(d => d.code === districtId);
        if (!district) return;

        // Check if this district has any selected wards
        const wardsInThisDistrict = serviceWardIds.filter(wardId => {
          const ward = wards.find(w => w.code === wardId);
          return ward && ward.districtCode === districtId;
        });

        if (wardsInThisDistrict.length > 0) {
          // District has specific wards selected -> add each ward
          wardsInThisDistrict.forEach(wardId => {
            const ward = wards.find(w => w.code === wardId);
            if (ward) {
              formattedServiceAreas.push({
                provinceCode: district.provinceCode || ward.provinceCode,
                districtCode: districtId,
                wardCode: wardId
              });
            }
          });
        } else {
          // No wards selected for this district -> entire district
          formattedServiceAreas.push({
            provinceCode: district.provinceCode,
            districtCode: districtId,
            wardCode: null
          });
        }
      });
    } else if (serviceProvinceIds.length > 0) {
      // Only provinces selected, no districts
      serviceProvinceIds.forEach(provinceId => {
        formattedServiceAreas.push({
          provinceCode: provinceId,
          districtCode: null,
          wardCode: null
        });
      });
    }

    router.push({
      pathname: "/(citizen)/register-enterprise",
      params: {
        name,
        address: fullAddress,
        latitude: mapLocation!.latitude.toString(),
        longitude: mapLocation!.longitude.toString(),
        capacityKg: capacity,
        serviceAreas: JSON.stringify(formattedServiceAreas),
        wasteTypes: JSON.stringify(selectedWasteTypes),
      }
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header
          title={t("registerEnterprise.title")}
          subtitle={t("registerEnterprise.subtitle")}
          showBack
          backFallbackRoute={backFallbackRoute}
        />

        <View style={styles.form}>
          <Input
            label={t("registerEnterprise.name")}
            placeholder={t("registerEnterprise.namePlaceholder")}
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <Text style={styles.sectionTitle}>{t("registerEnterprise.addressSection")}</Text>

          <MapLocationPicker
            label={t("registerEnterprise.mapLabel")}
            onLocationSelect={handleMapLocationSelect}
            initialLocation={mapLocation ? { latitude: mapLocation.latitude, longitude: mapLocation.longitude } : undefined}
            error={errors.mapLocation}
          />

          {mapLocation && (
            <View style={styles.addressDisplayCard}>
              <Text style={styles.addressLabel}>{t("registerEnterprise.areaDetected")}</Text>

              <View style={styles.addressPickersRow}>
                <View style={{ flex: 1 }}>
                  <Picker
                    label="Tỉnh/Thành phố"
                    options={provinces.map(p => ({ label: p.name, value: p.code }))}
                    selectedValue={addressProvinceId}
                    onValueChange={(val) => {
                      setAddressProvinceId(val);
                      setIsFieldAutoFilled(prev => ({ ...prev, province: false, district: false, ward: false }));
                    }}
                    disabled={isFieldAutoFilled.province}
                    placeholder="Chọn Tỉnh/TP"
                  />
                  {isFieldAutoFilled.province && (
                    <View style={styles.autoFilledBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={AppColors.success} />
                      <Text style={styles.autoFilledText}>Đã tự ghim</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Picker
                    label="Quận/Huyện"
                    options={addressDistricts.map(d => ({ label: d.name, value: d.code }))}
                    selectedValue={addressDistrictId}
                    onValueChange={(val) => {
                      setAddressDistrictId(val);
                      setIsFieldAutoFilled(prev => ({ ...prev, district: false, ward: false }));
                    }}
                    disabled={isFieldAutoFilled.district || !addressProvinceId}
                    placeholder="Chọn Quận/Huyện"
                  />
                  {isFieldAutoFilled.district && (
                    <View style={styles.autoFilledBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={AppColors.success} />
                      <Text style={styles.autoFilledText}>Đã tự ghim</Text>
                    </View>
                  )}
                </View>
              </View>

              <Picker
                label="Phường/Xã"
                options={addressWards.map(w => ({ label: w.name, value: w.code }))}
                selectedValue={addressWardId}
                onValueChange={(val) => {
                  setAddressWardId(val);
                  setIsFieldAutoFilled(prev => ({ ...prev, ward: false }));
                }}
                disabled={isFieldAutoFilled.ward || !addressDistrictId}
                placeholder="Chọn Phường/Xã"
              />
              {isFieldAutoFilled.ward && (
                <View style={styles.autoFilledBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={AppColors.success} />
                  <Text style={styles.autoFilledText}>Đã tự ghim</Text>
                </View>
              )}
            </View>
          )}

          {loading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={{ marginLeft: 8, color: AppColors.primary }}>Đang kiểm tra vị trí...</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => { setTempAddress(address); setIsAddressModalVisible(true); }} activeOpacity={0.7}>
            <View pointerEvents="none">
              <Input
                label={t("registerEnterprise.detailedAddress")}
                placeholder={t("registerEnterprise.autoFill")}
                value={address}
                editable={false}
                error={errors.address}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label={t("registerEnterprise.capacity")}
                placeholder="1000.5"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="decimal-pad"
                error={errors.capacity}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("registerEnterprise.serviceArea")}</Text>
          <MultiSelectPicker
            label={t("registerEnterprise.serviceProvince")}
            options={provinces.map(p => ({ value: p.code, label: p.name }))}
            selectedValues={serviceProvinceIds}
            onValuesChange={setServiceProvinceIds}
            error={errors.serviceArea}
          />

          {serviceProvinceIds.length > 0 && (
            <GroupedServiceAreaPicker
              provinces={provinces
                .filter(p => serviceProvinceIds.includes(p.code))
                .map(p => ({ code: p.code, name: p.name }))}
              districts={districts}
              wards={wards}
              selectedDistrictIds={serviceDistrictIds}
              selectedWardIds={serviceWardIds}
              onDistrictsChange={setServiceDistrictIds}
              onWardsChange={setServiceWardIds}
              districtLabel={t("registerEnterprise.serviceDistrict")}
              wardLabel={t("registerEnterprise.serviceWard")}
            />
          )}

          {errors.serviceArea && (
            <Text style={styles.errorText}>{errors.serviceArea}</Text>
          )}

          <WasteTypeMultiSelector
            selectedTypes={selectedWasteTypes}
            onTypesChange={setSelectedWasteTypes}
            label={t("registerEnterprise.wasteTypes")}
            error={errors.wasteTypes}
          />


          <Button
            title={t("registerEnterprise.continue")}
            onPress={nextStep}
            style={styles.submitButton}
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
              <Text style={styles.modalTitle}>{t("registerEnterprise.detailedAddress")}</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  addressDisplayCard: {
    backgroundColor: AppColors.primary + "10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  addressPickersRow: {
    flexDirection: "row",
    gap: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  autoFilledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -8,
    marginBottom: 8,
    alignSelf: "flex-end",
  },
  autoFilledText: {
    fontSize: 10,
    color: AppColors.success,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 11,
    color: AppColors.error,
    marginTop: 6,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 50,
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
