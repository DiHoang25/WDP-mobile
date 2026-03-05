import { Button, Card, Header, Input, MapLocationPicker, Picker } from "@/components/common";
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
import * as ExpoLocation from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
      t("createReport.locationTitle"),
      t("createReport.locationAsk"),
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
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("common.error"), t("createReport.locationDenied"));
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
      console.log('📍 Getting address for coords:', coords);
      const results = await ExpoLocation.reverseGeocodeAsync(coords);
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

        // Use the full formatted address for the street address input
        if (formattedAddress) {
          console.log('✏️ Setting streetAddress to:', formattedAddress);
          setStreetAddress(formattedAddress);
        }
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
    const res = await locationService.getDistricts(code);
    if (res.success && res.data) setDistricts(res.data);
  };

  const handleDistrictChange = async (code: string) => {
    setDistrictCode(code);
    setWardCode("");
    setWards([]);
    const res = await locationService.getWards(code);
    if (res.success && res.data) setWards(res.data);
  };

  const handleMapLocationSelect = async (loc: any) => {
    setMapLocation(loc);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // START: Clear all previous location states to prevent stale data (like Quận 1)
      setProvinceCode("");
      setDistrictCode("");
      setWardCode("");
      setDistricts([]);
      setWards([]);

      // Update Detailed Address input immediately
      console.log('🗺️ Full location object:', JSON.stringify(loc, null, 2));
      console.log('📍 Raw address from map:', JSON.stringify(raw, null, 2));

      // PRIORITY 1: Use full formatted address if available (for complete info)
      if (loc.address && loc.address !== "Đang xác định..." && loc.address !== "Đang xác định địa chỉ...") {
        console.log('✅ Setting street address from full address:', loc.address);
        setStreetAddress(loc.address);
      }
      // PRIORITY 2: Fallback to constructed address from raw data
      else if (raw.name || raw.street) {
        let detailedAddress = "";
        if (raw.name) detailedAddress = raw.name;
        if (raw.street && raw.street !== raw.name) {
          detailedAddress = detailedAddress ? `${detailedAddress}, ${raw.street}` : raw.street;
        }
        if (detailedAddress) {
          console.log('✅ Setting street address from raw parts:', detailedAddress);
          setStreetAddress(detailedAddress);
        }
      }
      else {
        console.log('⚠️ No address data available');
      }

      // Wait for provinces to load if they haven't yet
      let provincesData = provinces;
      if (provincesData.length === 0) {
        console.log('Provinces not loaded yet, fetching...');
        const res = await locationService.getProvinces();
        if (res.success && res.data) {
          setProvinces(res.data);
          provincesData = res.data;
        }
      }

      // Robust Province Identification
      const provinceName = raw.province || raw.region || (raw.city && raw.city.includes("Thành phố") ? raw.city : "");
      let normProvince = normalizeLocationName(provinceName);

      console.log('Attempting to match province:', { provinceName, normProvince, provincesCount: provincesData.length });

      let matchedProvince = null;
      if (normProvince && provincesData.length > 0) {
        matchedProvince = provincesData.find((p: any) => {
          const pNorm = normalizeLocationName(p.name);
          return normProvince.includes(pNorm) || pNorm.includes(normProvince);
        });
      }

      // FALLBACK 1: If no province match from structured data, search full address string
      if (!matchedProvince && loc.address && provincesData.length > 0) {
        const normFullAddress = normalizeLocationName(loc.address);
        console.log('🔍 Fallback matching Province - Searching in full address:', normFullAddress);
        matchedProvince = provincesData.find((p: any) => {
          const pNorm = normalizeLocationName(p.name);
          // Only match if the province name is actually present in the address string
          return normFullAddress.includes(pNorm);
        });
      }

      if (matchedProvince) {
        console.log('Matched province:', matchedProvince.name);
        setProvinceCode(matchedProvince.code);
        const distRes = await locationService.getDistricts(matchedProvince.code);
        if (distRes.success && distRes.data) {
          setDistricts(distRes.data);

          // District Identification - Use multiple candidates for flexibility (specifically for Thu Duc)
          const districtCandidates = [
            raw.district,
            raw.osm_city_district,
            raw.osm_town,
            raw.osm_city,
            raw.city
          ].filter(Boolean);

          console.log('🔍 District candidates:', districtCandidates);

          let matchedDistrict = null;
          for (const candidate of districtCandidates) {
            const normCand = normalizeLocationName(candidate);
            matchedDistrict = distRes.data.find((d: any) => {
              const dNorm = normalizeLocationName(d.name);
              return normCand.includes(dNorm) || dNorm.includes(normCand);
            });
            if (matchedDistrict) {
              console.log('✅ Matched district from candidate:', candidate, '->', matchedDistrict.name);
              break;
            }
          }

          // FALLBACK 2: Search for district in full address if candidates matching failed
          if (!matchedDistrict && loc.address) {
            const normFullAddress = normalizeLocationName(loc.address);
            console.log('🔍 Fallback matching District - Searching in full address:', normFullAddress);
            matchedDistrict = distRes.data.find((d: any) => {
              const dNorm = normalizeLocationName(d.name);
              return normFullAddress.includes(dNorm);
            });
          }

          if (matchedDistrict) {
            console.log('Matched district FINAL:', matchedDistrict.name);
            setDistrictCode(matchedDistrict.code);
            const wardRes = await locationService.getWards(matchedDistrict.code);
            if (wardRes.success && wardRes.data) {
              setWards(wardRes.data);

              // Ward Identification - Use multiple candidates
              const wardCandidates = [
                raw.ward,
                raw.subdistrict,
                raw.osm_suburb,
                raw.osm_city_district,
              ].filter(Boolean);

              console.log('🔍 Ward candidates:', wardCandidates);

              let matchedWard = null;
              for (const candidate of wardCandidates) {
                const normCand = normalizeLocationName(candidate);
                matchedWard = wardRes.data.find((w: any) => {
                  const wNorm = normalizeLocationName(w.name);
                  return normCand.includes(wNorm) || wNorm.includes(normCand);
                });
                if (matchedWard) {
                  console.log('✅ Matched ward from candidate:', candidate, '->', matchedWard.name);
                  break;
                }
              }

              if (matchedWard) {
                console.log('✅ Matched ward FINAL:', matchedWard.name);
                setWardCode(matchedWard.code);
              } else {
                console.log('❌ No matching ward found in structured candidates. Trying fallback...');
                // FALLBACK: Try searching for ward names inside the full address string
                if (loc.address) {
                  const normFullAddress = normalizeLocationName(loc.address);
                  console.log('🔍 Fallback matching Ward - Searching in full address:', normFullAddress);
                  const fallbackWard = wardRes.data.find((w: any) => {
                    const wNorm = normalizeLocationName(w.name);
                    return normFullAddress.includes(wNorm);
                  });
                  if (fallbackWard) {
                    console.log('✅ Fallback Match Ward from address string:', fallbackWard.name);
                    setWardCode(fallbackWard.code);
                  } else {
                    setWardCode(""); // Really no match
                  }
                } else {
                  setWardCode(""); // Really no match
                }
              }
            } // end if (wardRes.success)
          } else {
            console.log('No matching district found for candidates:', districtCandidates);
            setDistrictCode("");
            setWardCode("");
          } // end if (matchedDistrict)
        } // end if (distRes.success)
      } else {
        console.log('No matching province found for:', provinceName);
        setProvinceCode("");
        setDistrictCode("");
        setWardCode("");
      } // end if (matchedProvince)
    } // end if (loc.rawAddress)
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
      Alert.alert(t("createReport.locationTitle"), t("createReport.selectMapFirst"));
    }

    if (!streetAddress.trim()) {
      newErrors.street = t("createReport.addressMissing");
    }

    if (!provinceCode || !districtCode || !wardCode) {
      newErrors.location = t("createReport.locationUnclear");
      Alert.alert(t("createReport.locationUnclear"), t("createReport.locationUnclearMsg"));
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
          t("createReport.cameraPermission", { source: useCamera ? "camera" : "library" }),
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
      // Distance validation: check if edited address is within 1km of pinned location
      if (mapLocation && streetAddress.trim()) {
        const geoResult = await locationService.geocodeAddress(streetAddress, latitude, longitude);
        if (geoResult.success && geoResult.data) {
          const dist = locationService.haversineDistance(
            latitude, longitude,
            geoResult.data.latitude, geoResult.data.longitude
          );
          console.log(`📏 Submit validation distance: ${dist.toFixed(3)} km`);
          if (dist > 1.0) {
            setLoading(false);
            Alert.alert(
              t("createReport.locationMismatch"),
              t("createReport.locationMismatchMsg", { distance: dist.toFixed(1) })
            );
            return;
          }
        }
      }

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
                    <Text style={styles.fullAddressText}>
                      {locationText}
                    </Text>

                    <View style={styles.manualSelection}>
                      <Picker
                        label={t("createReport.province")}
                        placeholder={t("createReport.selectProvince")}
                        options={provinceOptions}
                        selectedValue={provinceCode}
                        onValueChange={handleProvinceChange}
                        disabled={true}
                        error={errors.province}
                      />
                      <Picker
                        label={t("createReport.district")}
                        placeholder={t("createReport.selectDistrict")}
                        options={districtOptions}
                        selectedValue={districtCode}
                        onValueChange={handleDistrictChange}
                        disabled={true}
                        error={errors.district}
                      />
                      <Picker
                        label={t("createReport.ward")}
                        placeholder={t("createReport.selectWard")}
                        options={wardOptions}
                        selectedValue={wardCode}
                        onValueChange={setWardCode}
                        disabled={true}
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
            <Input
              label={t("createReport.streetPlaceholder")}
              placeholder={t("createReport.streetAutoFill")}
              value={streetAddress}
              onChangeText={(text: string) => {
                setStreetAddress(text);
                setErrors({ ...errors, street: undefined });
              }}
              editable={true}
              multiline={true}
              numberOfLines={3}
              error={errors.street}
              icon="location-outline"
              containerStyle={{ marginBottom: 0 }}
            />
            {streetAddress ? (
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={async () => {
                  if (!mapLocation) {
                    Alert.alert(t("common.notice"), t("createReport.selectMapFirst"));
                    return;
                  }
                  // Build full address with ward/district/province for better geocoding accuracy
                  const geoResult = await locationService.geocodeAddress(streetAddress, latitude, longitude);
                  if (geoResult.success && geoResult.data) {
                    const dist = locationService.haversineDistance(
                      latitude, longitude,
                      geoResult.data.latitude, geoResult.data.longitude
                    );
                    if (dist > 1.0) {
                      Alert.alert(
                        t("createReport.locationMismatch"),
                        t("createReport.locationMismatchMsg", { distance: dist.toFixed(1) })
                      );
                    } else {
                      Alert.alert(t("createReport.addressValid"), t("createReport.addressValidMsg", { distance: (dist * 1000).toFixed(0) }));
                    }
                  } else {
                    Alert.alert(t("createReport.addressNotFound"), t("createReport.addressNotFoundMsg"));
                  }
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={AppColors.primary} />
                <Text style={styles.validateBtnText}>{t("createReport.checkAddress")}</Text>
              </TouchableOpacity>
            ) : null}
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
});
