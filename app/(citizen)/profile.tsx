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

export default function ProfileScreen() {
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

  const menuItems = [
    // Show "Đăng ký doanh nghiệp" only for citizens (roleId = 1)
    ...(user?.roleId === 1
      ? [
          {
            icon: "business",
            title: "Đăng ký doanh nghiệp",
            subtitle: "Trở thành đối tác xử lý rác",
            onPress: () =>
              router.push("/(citizen)/register-enterprise-form" as any),
            highlight: true,
          },
        ]
      : []),
    {
      icon: "document-text",
      title: "Lịch sử báo cáo",
      subtitle: "Xem các báo cáo đã tạo",
      onPress: () => router.push("/(citizen)/history"),
      highlight: true,
    },
    {
      icon: "gift",
      title: "Đổi thưởng",
      subtitle: "Đổi điểm lấy phần thưởng",
      onPress: () => router.push("/(citizen)/rewards"),
      highlight: true,
    },
    {
      icon: "person",
      title: "Thông tin cá nhân",
      subtitle: "Cập nhật thông tin",
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
    {
      icon: "location",
      title: "Địa chỉ",
      subtitle: user?.address,
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
    {
      icon: "notifications",
      title: "Thông báo",
      subtitle: "Cài đặt thông báo",
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
    {
      icon: "language",
      title: "Ngôn ngữ",
      subtitle: "Tiếng Việt",
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
    {
      icon: "help-circle",
      title: "Trợ giúp & Hỗ trợ",
      subtitle: "Câu hỏi thường gặp",
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
    {
      icon: "document",
      title: "Điều khoản sử dụng",
      subtitle: "Chính sách & Điều khoản",
      onPress: () => Alert.alert("Thông báo", "Tính năng đang phát triển"),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Hồ sơ"
        subtitle="Quản lý thông tin cá nhân"
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
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "?"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person" size={14} color={AppColors.primary} />
              <Text style={styles.roleBadgeText}>Công dân</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statRow}>
                <Ionicons name="star" size={18} color={AppColors.warning} />
                <Text style={styles.statValue}>{user?.points || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Điểm tích lũy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statRow}>
                <Ionicons name="location" size={18} color={AppColors.primary} />
                <Text style={styles.statValue}>{user?.district}</Text>
              </View>
              <Text style={styles.statLabel}>Khu vực</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} onPress={item.onPress}>
            <Card
              variant="default"
              style={StyleSheet.flatten([
                styles.menuItem,
                item.highlight && styles.menuItemHighlight,
              ])}
            >
              <View style={styles.menuContent}>
                <View
                  style={StyleSheet.flatten([
                    styles.menuIconContainer,
                    item.highlight && styles.menuIconHighlight,
                  ])}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={
                      item.highlight
                        ? AppColors.primary
                        : AppColors.textSecondary
                    }
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text
                    style={StyleSheet.flatten([
                      styles.menuTitle,
                      item.highlight && styles.menuTitleHighlight,
                    ])}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
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
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: AppColors.primary + "30",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: AppColors.primary + "30",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: AppColors.primary,
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
    backgroundColor: AppColors.primary + "20",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  statsContainer: {
    flexDirection: "row",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: AppColors.gray[300],
  },
  menuContainer: {
    padding: 20,
    gap: 10,
  },
  menuItem: {
    marginBottom: 0,
  },
  menuItemHighlight: {
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
    backgroundColor: AppColors.primary + "05",
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
  menuIconHighlight: {
    backgroundColor: AppColors.primary + "20",
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
  menuTitleHighlight: {
    color: AppColors.primary,
    fontWeight: "700",
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
