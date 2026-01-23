import { Button, Header, Input, MapLocationPicker, MultiSelectPicker } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { District, locationService, Province, Ward } from "@/services/location.service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RegisterEnterpriseFormScreen() {
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

  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");

  const [errors, setErrors] = useState<any>({});

  // Map location for enterprise address
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    rawAddress?: any;
  } | null>(null);

  // Helper to normalize and compare Vietnamese location names
  const normalizeLocationName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/^(tỉnh|thành phố|thành phồ|quận|huyện|thị xã|phường|xã|thị trấn|p\.|q\.)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Auto-fill address elements when map location is selected
  const handleMapLocationSelect = async (loc: any) => {
    setMapLocation(loc);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // 1. Fill detailed address
      const streetPart = [raw.name, raw.street].filter(Boolean).join(" ");
      if (streetPart) setAddress(streetPart);

      // 2. Try to match Province
      const provinceName = raw.region || raw.city || "";
      const normProvince = normalizeLocationName(provinceName);

      if (normProvince && provinces.length > 0) {
        const matchedProvince = provinces.find(p => {
          const pNorm = normalizeLocationName(p.name);
          return normProvince.includes(pNorm) || pNorm.includes(normProvince);
        });

        if (matchedProvince) {
          setAddressProvinceId(matchedProvince.code);

          // 3. Load and match District
          const distRes = await locationService.getDistricts(matchedProvince.code);
          if (distRes.success && distRes.data) {
            setAddressDistricts(distRes.data);
            const districtName = raw.district || raw.city_district || raw.suburb || "";
            const normDistrict = normalizeLocationName(districtName);

            const matchedDistrict = distRes.data.find(d => {
              const dNorm = normalizeLocationName(d.name);
              return normDistrict.includes(dNorm) || dNorm.includes(normDistrict);
            });

            if (matchedDistrict) {
              setAddressDistrictId(matchedDistrict.code);

              // 4. Load and match Ward
              const wardRes = await locationService.getWards(matchedDistrict.code);
              if (wardRes.success && wardRes.data) {
                setAddressWards(wardRes.data);

                const wardCandidates = [
                  raw.ward,
                  raw.suburb,
                  raw.subdistrict,
                  raw.neighbourhood,
                  raw.quarter,
                  raw.hamlet,
                  raw.village
                ].filter(Boolean);

                let matchedWard = null;
                for (const candidate of wardCandidates) {
                  const normCandidate = normalizeLocationName(candidate);
                  matchedWard = wardRes.data.find(w => {
                    const wNorm = normalizeLocationName(w.name);
                    return normCandidate.includes(wNorm) || wNorm.includes(normCandidate);
                  });
                  if (matchedWard) break;
                }

                if (matchedWard) setAddressWardId(matchedWard.code);
              }
            }
          }
        }
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
    if (!name) newErrors.name = "Vui lòng nhập tên doanh nghiệp";
    if (!address) newErrors.address = "Vui lòng nhập địa chỉ chi tiết";
    if (!capacity || isNaN(parseFloat(capacity))) newErrors.capacity = "Khối lượng không hợp lệ";

    if (!mapLocation) {
      newErrors.mapLocation = "Vui lòng chọn vị trí trên bản đồ";
    }

    // Validate working hours
    const validateTime = (time: string): boolean => {
      const timeRegex = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])$/;
      if (!timeRegex.test(time)) return false;

      const [hours, minutes] = time.split(':').map(Number);
      return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60;
    };

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    if (!startTime || !validateTime(startTime)) {
      newErrors.startTime = "Giờ bắt đầu không hợp lệ (định dạng: HH:mm, 00:00-24:00)";
    }

    if (!endTime || !validateTime(endTime)) {
      newErrors.endTime = "Giờ kết thúc không hợp lệ (định dạng: HH:mm, 00:00-24:00)";
    }

    if (startTime && endTime && validateTime(startTime) && validateTime(endTime)) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      if (endMinutes <= startMinutes) {
        newErrors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
      }
    }

    // Validate service areas - require at least one selection
    if (serviceProvinceIds.length === 0) {
      newErrors.serviceArea = "Vui lòng chọn ít nhất một khu vực phục vụ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save state and navigate to plans selection
    // Build full address from selections
    const selectedProvince = provinces.find(p => p.code === addressProvinceId);
    const selectedDistrict = addressDistricts.find(d => d.code === addressDistrictId);
    const selectedWard = addressWards.find(w => w.code === addressWardId);

    const fullAddress = [
      address, // detailed address
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name
    ].filter(Boolean).join(', ');

    // Build structured service areas
    const formattedServiceAreas: any[] = [];

    // Priority: Wards > Districts > Provinces
    if (serviceWardIds.length > 0) {
      serviceWardIds.forEach(wid => {
        const ward = wards.find(w => w.code === wid);
        if (ward) {
          formattedServiceAreas.push({
            provinceCode: ward.provinceCode,
            districtCode: ward.districtCode,
            wardCode: ward.code
          });
        }
      });
    } else if (serviceDistrictIds.length > 0) {
      serviceDistrictIds.forEach(did => {
        const district = districts.find(d => d.code === did);
        if (district) {
          formattedServiceAreas.push({
            provinceCode: district.provinceCode,
            districtCode: district.code,
            wardCode: null
          });
        }
      });
    } else if (serviceProvinceIds.length > 0) {
      serviceProvinceIds.forEach(pid => {
        formattedServiceAreas.push({
          provinceCode: pid,
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
        startTime,
        endTime,
      }
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Đăng ký doanh nghiệp" subtitle="Thông tin cơ bản" showBack />

        <View style={styles.form}>
          <Input
            label="Tên doanh nghiệp"
            placeholder="Công ty TNHH Môi trường Xanh"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <Text style={styles.sectionTitle}>Địa chỉ doanh nghiệp</Text>

          <MapLocationPicker
            label="Chọn vị trí đoanh nghiệp trên bản đồ"
            onLocationSelect={handleMapLocationSelect}
            error={errors.mapLocation}
          />

          {mapLocation && (
            <View style={styles.addressDisplayCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={20} color={AppColors.primary} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Khu vực đã xác định:</Text>
                  <Text style={styles.fullAddressText}>
                    {[
                      addressWards.find(w => w.code === addressWardId)?.name,
                      addressDistricts.find(d => d.code === addressDistrictId)?.name,
                      provinces.find(p => p.code === addressProvinceId)?.name
                    ].filter(Boolean).join(", ") || "Đang xác định khu vực..."}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Input
            label="Địa chỉ chi tiết (nhập thủ công nếu cần)"
            placeholder="Số nhà, tên đường..."
            value={address}
            onChangeText={setAddress}
            error={errors.address}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Khả năng xử lý (kg)"
                placeholder="1000.5"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="decimal-pad"
                error={errors.capacity}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Khu vực phục vụ mặc định</Text>
          <MultiSelectPicker
            label="Tỉnh / Thành phố"
            options={provinces.map(p => ({ value: p.code, label: p.name }))}
            selectedValues={serviceProvinceIds}
            onValuesChange={setServiceProvinceIds}
            error={errors.serviceArea}
          />

          <MultiSelectPicker
            label="Quận / Huyện phục vụ"
            options={districts.map(d => ({
              value: d.code,
              label: d.name,
              subLabel: d.provinceName
            }))}
            selectedValues={serviceDistrictIds}
            onValuesChange={setServiceDistrictIds}
            disabled={serviceProvinceIds.length === 0}
          />

          <MultiSelectPicker
            label="Phường / Xã phục vụ"
            options={wards.map(w => ({
              value: w.code,
              label: w.name,
              subLabel: w.districtName
            }))}
            selectedValues={serviceWardIds}
            onValuesChange={setServiceWardIds}
            disabled={serviceDistrictIds.length === 0}
          />
          {/* 
          <Text style={styles.sectionTitle}>Giờ làm việc</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Input
                label="Bắt đầu"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="08:00"
                error={errors.startTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Kết thúc"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                error={errors.endTime}
              />
            </View>
          </View> */}

          <Button
            title="Tiếp tục chọn gói"
            onPress={nextStep}
            style={styles.submitButton}
          />
        </View>
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
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 11,
    color: AppColors.error,
    marginTop: 6,
    fontStyle: "italic",
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 50,
  },
});
