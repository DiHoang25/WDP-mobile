import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { WASTE_TYPES } from "@/data/mockData";
import { EnterpriseProfile, enterpriseService } from "@/services/enterprise.service";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function EnterpriseProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<EnterpriseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await enterpriseService.getProfile();

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        console.error('Failed to load profile:', response.error);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin doanh nghiệp');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[AppColors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="business" size={40} color={AppColors.primary} />
        </View>
        <Text style={styles.userName}>{profile?.name || user?.name || user?.email}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Info Card */}
        {profile && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin doanh nghiệp</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={AppColors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Địa chỉ</Text>
                    <Text style={styles.infoValue}>{profile.address}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={20} color={AppColors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Công suất</Text>
                    <Text style={styles.infoValue}>{profile.capacityKg} kg</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Service Areas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Khu vực phục vụ</Text>
              <View style={styles.chipContainer}>
                {profile.serviceAreas.map((area, index) => (
                  <View key={index} style={styles.chip}>
                    <Ionicons name="location" size={14} color={AppColors.primary} />
                    <Text style={styles.chipText}>
                      {area.wardCode ? 'Phường/Xã' : area.districtCode ? 'Quận/Huyện' : 'Tỉnh/TP'}: {area.provinceCode}
                      {area.districtCode && `-${area.districtCode}`}
                      {area.wardCode && `-${area.wardCode}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Waste Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Loại rác thu gom</Text>
              <View style={styles.chipContainer}>
                {profile.wasteTypes.map((type, index) => {
                  const typeInfo = WASTE_TYPES.find(t => t.value === type.wasteType?.toUpperCase());
                  return (
                    <View
                      key={index}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: (typeInfo?.color || AppColors.success) + '15',
                          borderColor: typeInfo?.color || AppColors.success
                        }
                      ]}
                    >
                      <Ionicons
                        name={typeInfo?.icon as any || 'trash-outline'}
                        size={14}
                        color={typeInfo?.color || AppColors.success}
                      />
                      <Text style={[styles.wasteChipText, { color: typeInfo?.color || AppColors.success }]}>
                        {getWasteTypeLabel(type.wasteType)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={AppColors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  header: {
    backgroundColor: AppColors.white,
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.primary + '30',
  },
  chipText: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '600',
  },
  wasteChip: {
    backgroundColor: AppColors.success + '10',
    borderColor: AppColors.success + '30',
  },
  wasteChipText: {
    fontSize: 13,
    color: AppColors.success,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.error,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.error,
  },
});
