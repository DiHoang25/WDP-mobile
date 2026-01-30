import { Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profile.service";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileDetailScreen() {
    const { user, updateUser, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const response = await profileService.getProfile();
                    if (response.success && response.data) {
                        updateUser(response.data as any);
                    }
                } catch (error) {
                    console.error("Fetch profile details error:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [])
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    const InfoRow = ({ icon, label, value, color = AppColors.textPrimary }: any) => (
        <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: color + "10" }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.textColumn}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, { color }]}>{value || "---"}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header
                title="Thông tin chi tiết"
                showBack={true}
                onBackPress={() => {
                    router.replace("/(citizen)/profile");
                }}
            />

            {loading && !user ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                </View>
            ) : !user ? (
                <View style={styles.loadingContainer}>
                    <Text style={{ color: AppColors.textSecondary }}>Không tìm thấy thông tin người dùng</Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Header Card */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => router.push("/(citizen)/profile-edit")}
                        >
                            <Ionicons name="create-outline" size={18} color={AppColors.white} />
                            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Detailed Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                        <View style={styles.card}>
                            <InfoRow
                                icon="person-outline"
                                label="Họ và tên"
                                value={user?.name}
                                color={AppColors.primary}
                            />
                            <InfoRow
                                icon="call-outline"
                                label="Số điện thoại"
                                value={user?.phone}
                                color={AppColors.secondary}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                        <View style={styles.card}>
                            <InfoRow
                                icon="ribbon-outline"
                                label="Cấp bậc"
                                value={user?.role === "citizen" ? "Công dân" : user?.role || "Thành viên"}
                                color={AppColors.warning}
                            />
                            <InfoRow
                                icon="shield-checkmark-outline"
                                label="Trạng thái"
                                value={user?.status === "ACTIVE" ? "Đang hoạt động" : user?.status}
                                color={AppColors.success}
                            />
                            <InfoRow
                                icon="calendar-outline"
                                label="Ngày tham gia"
                                value={formatDate((user as any)?.createdAt)}
                                color={AppColors.gray[400]}
                            />
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: 30,
        backgroundColor: AppColors.white,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarContainer: {
        marginBottom: 15,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: AppColors.white,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: AppColors.primary + "15",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: AppColors.white,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    userName: {
        fontSize: 22,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: AppColors.textSecondary,
        marginBottom: 20,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    editButtonText: {
        color: AppColors.white,
        fontWeight: "600",
        fontSize: 14,
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 12,
        marginTop: 20,
    },
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 20,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    textColumn: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: AppColors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
    },
});
