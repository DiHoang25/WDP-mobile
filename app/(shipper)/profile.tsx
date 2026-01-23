import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ShipperProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
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

  const handleMenuPress = (title: string) => {
    Alert.alert("Thông báo", "Tính năng đang phát triển");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Hồ sơ"
        subtitle="Quản lý thông tin shipper"
        showBack={false}
      />

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <Card variant="elevated">
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="car" size={14} color={AppColors.shipper} />
              <Text style={styles.roleBadgeText}>Shipper</Text>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleLabel}>Phương tiện</Text>
            <Text style={styles.vehicleInfo}>{user?.vehicleType}</Text>
            <Text style={styles.vehicleNumber}>{user?.vehicleNumber}</Text>
          </View>
        </Card>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <TouchableOpacity onPress={() => handleMenuPress("Thống kê")}>
          <Card variant="default" style={styles.menuItem}>
            <View style={styles.menuContent}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name="stats-chart"
                  size={22}
                  color={AppColors.textSecondary}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Thống kê</Text>
                <Text style={styles.menuSubtitle}>Xem hiệu suất làm việc</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleMenuPress("Cài đặt")}>
          <Card variant="default" style={styles.menuItem}>
            <View style={styles.menuContent}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name="settings"
                  size={22}
                  color={AppColors.textSecondary}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Cài đặt</Text>
                <Text style={styles.menuSubtitle}>
                  Thông báo & cài đặt khác
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Button
          title="Đăng xuất"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>EcoCollect v1.0.0</Text>
        <Text style={styles.appInfoText}>
          © 2026 EcoCollect. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: AppColors.shipper + "30",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.shipper + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: AppColors.shipper + "30",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: AppColors.shipper,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AppColors.shipper + "20",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.shipper,
  },
  vehicleSection: {
    alignItems: "center",
  },
  vehicleLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  vehicleInfo: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  vehicleNumber: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 5,
  },
  menuContainer: {
    padding: 20,
    gap: 10,
  },
  menuItem: {
    marginBottom: 0,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: AppColors.gray[400],
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    borderColor: AppColors.error,
  },
  appInfo: {
    alignItems: "center",
    paddingBottom: 30,
  },
  appInfoText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 5,
  },
});
