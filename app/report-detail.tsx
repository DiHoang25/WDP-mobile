import { Card, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import { getStatusColor, getStatusText, getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function ReportDetailScreen() {
    const { id, content: notificationContent, senderName } = useLocalSearchParams();
    const [report, setReport] = useState<WasteReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [locationNames, setLocationNames] = useState({
        province: "",
        district: "",
        ward: ""
    });

    useEffect(() => {
        if (id) {
            fetchReportDetail(id as string);
        } else {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (report) {
            fetchLocationNames();
        }
    }, [report]);

    const fetchReportDetail = async (reportId: string) => {
        try {
            setLoading(true);
            setError(false);
            const response = await wasteService.getReportById(Number(reportId));
            if (response.success && response.data) {
                setReport(response.data);
            } else {
                setError(true);
            }
        } catch (error) {
            console.error("Fetch report detail error:", error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationNames = async () => {
        if (!report) return;

        const names = { ...locationNames };

        try {
            if (report.provinceCode) {
                const pRes = await fetch(`https://provinces.open-api.vn/api/p/${report.provinceCode}`);
                const pData = await pRes.json();
                names.province = pData.name;
            }
            if (report.districtCode) {
                const dRes = await fetch(`https://provinces.open-api.vn/api/d/${report.districtCode}`);
                const dData = await dRes.json();
                names.district = dData.name;
            }
            if (report.wardCode) {
                const wRes = await fetch(`https://provinces.open-api.vn/api/w/${report.wardCode}`);
                const wData = await wRes.json();
                names.ward = wData.name;
            }
            setLocationNames(names);
        } catch (err) {
            console.error("Error fetching location names:", err);
        }
    };

    // Derived values
    const enterpriseDisplayName = report?.enterprise?.name || report?.enterpriseName || (senderName as string) || null;
    const displaySender = enterpriseDisplayName;
    const displayContent = notificationContent || report?.content || report?.description;

    // Use reported data or fallbacks
    const status = report?.status;
    const canCancel = status?.toUpperCase() === "PENDING" || status?.toUpperCase() === "ACCEPTED";

    const handleCancel = async () => {
        if (!report) return;

        Alert.alert(
            "Xác nhận hủy",
            "Bạn có chắc chắn muốn hủy báo cáo này không?",
            [
                { text: "Bỏ qua", style: "cancel" },
                {
                    text: "Đồng ý hủy",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            const response = await wasteService.cancelReport(Number(report.id), "Người dùng hủy qua ứng dụng");
                            if (response.success) {
                                Alert.alert("Thành công", "Báo cáo của bạn đã được hủy.");
                                fetchReportDetail(report.id); // Tải lại dữ liệu
                            } else {
                                Alert.alert("Lỗi", response.error || "Không thể hủy báo cáo.");
                            }
                        } catch (error) {
                            Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối hệ hệ thống.");
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const createdAt = report?.createdAt;
    const updatedAt = report?.updatedAt;
    const address = report?.address;
    const wasteItems = report?.wasteItems;
    const points = report?.points;
    const images = report?.images;
    const enterprise = report?.enterprise;
    const collector = report?.collector;
    const cancelReason = report?.cancelReason;

    // Check if we should show error (only if we have NO data to show)
    const showLoadError = !loading && error && !report && !displayContent;

    // Case-insensitive key extraction
    const getVal = (obj: any, keys: string[]) => {
        if (!obj) return undefined;
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) return obj[key];
        }
        return undefined;
    };

    // Unified waste items extraction
    const rawItems = getVal(report, ['wasteItems', 'WasteItems', 'waste_items']);
    let normalizedItems: any[] = [];
    if (Array.isArray(rawItems)) {
        normalizedItems = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
        normalizedItems = [rawItems];
    }

    const totalWeight = (normalizedItems.length > 0)
        ? normalizedItems.reduce((sum, item) => sum + (Number(item?.weightKg || item?.WeightKg || item?.weight_kg) || 0), 0)
        : (Number(getVal(report, ['weightKg', 'WeightKg', 'weight_kg'])) || 0);

    // Unified address logic: reuse the full address from backend if available
    // Otherwise build it from component names
    const addressStr = address || "";
    const isFullAddress = addressStr.includes(",") &&
        (addressStr.toLowerCase().includes("phường") ||
            addressStr.toLowerCase().includes("quận") ||
            addressStr.toLowerCase().includes("tỉnh") ||
            addressStr.toLowerCase().includes("thành phố"));

    const fullAddress = isFullAddress ? addressStr : [
        addressStr,
        locationNames.ward,
        locationNames.district,
        locationNames.province
    ].filter(Boolean).join(", ");

    return (
        <View style={styles.container}>
            <Header title="Chi tiết báo cáo" showBack={true} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Status Card - Always show if we have status */}
                {(status || report) && (
                    <View style={styles.statusCard}>
                        <View>
                            <Text style={styles.label}>Trạng thái</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(status!).text }]}>
                                {getStatusText(status!)}
                            </Text>
                        </View>
                        <View style={styles.dateContainer}>
                            <Text style={styles.label}>Cập nhật lúc</Text>
                            <Text style={styles.value}>
                                {new Date(updatedAt || createdAt!).toLocaleString("vi-VN")}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Enterprise Info */}
                {(enterprise || enterpriseDisplayName) && (
                    <Card variant="elevated" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Đơn vị xử lý</Text>
                        <View style={styles.userInfoRow}>
                            {enterprise?.avatar ? (
                                <Image source={{ uri: enterprise.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: AppColors.secondary }]}>
                                    <Ionicons name="business" size={24} color={AppColors.white} />
                                </View>
                            )}
                            <View style={styles.userMeta}>
                                <Text style={styles.userName}>{enterprise?.name || enterpriseDisplayName}</Text>
                                <Text style={styles.userPhone}>{enterprise?.phone || "Đã tiếp nhận báo cáo"}</Text>
                            </View>
                            {enterprise?.phone && (
                                <TouchableOpacity
                                    style={[styles.callButton, { backgroundColor: AppColors.secondary }]}
                                    onPress={() => {/* Handle call */ }}
                                >
                                    <Ionicons name="call" size={20} color={AppColors.white} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Card>
                )}

                {/* Collector Info */}
                {collector && (
                    <Card variant="elevated" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Người thu gom</Text>
                        <View style={styles.userInfoRow}>
                            {collector.avatar ? (
                                <Image source={{ uri: collector.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={24} color={AppColors.white} />
                                </View>
                            )}
                            <View style={styles.userMeta}>
                                <Text style={styles.userName}>{collector.fullName}</Text>
                                <Text style={styles.userPhone}>{collector.phone || "Đang thực hiện thu gom"}</Text>
                            </View>
                            {collector.phone && (
                                <TouchableOpacity
                                    style={styles.callButton}
                                    onPress={() => {/* Handle call */ }}
                                >
                                    <Ionicons name="call" size={20} color={AppColors.white} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Card>
                )}

                {/* 2. Content (From Notification or Report) */}
                {displayContent && (
                    <Card variant="elevated" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Nội dung báo cáo</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.contentText}>{displayContent}</Text>
                        </View>
                    </Card>
                )}

                {/* Cancel Reason */}
                {cancelReason && (
                    <Card variant="elevated" style={[styles.sectionCard, { borderColor: AppColors.error, borderWidth: 1 }]}>
                        <Text style={[styles.sectionTitle, { color: AppColors.error, borderLeftColor: AppColors.error }]}>Lý do hủy</Text>
                        <View style={styles.contentBox}>
                            <Text style={[styles.contentText, { color: AppColors.error }]}>{cancelReason}</Text>
                        </View>
                    </Card>
                )}

                {/* Loading State for Report Details */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <Loading />
                    </View>
                )}

                {/* Error State - ONLY show if we have absolutely nothing to show */}
                {showLoadError && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color={AppColors.error} />
                        <Text style={styles.errorText}>
                            Không thể tải thông tin chi tiết báo cáo gốc.
                            {'\n'}Có thể báo cáo đã bị xóa hoặc bạn không có quyền truy cập.
                        </Text>
                    </View>
                )}

                {/* 3. Full Report Details (Only if loaded) */}
                {!loading && report && (
                    <>
                        {/* Location Info */}
                        <Card variant="elevated" style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Địa điểm</Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="location" size={20} color={AppColors.primary} />
                                <Text style={styles.infoText}>{fullAddress}</Text>
                            </View>
                        </Card>

                        {/* Waste Details */}
                        <Card variant="elevated" style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Thông tin rác</Text>

                            <View style={styles.wasteList}>
                                {(() => {
                                    // Group items by waste type and sum weights
                                    const grouped = normalizedItems.length > 0
                                        ? normalizedItems.reduce((acc: Array<{ wasteType: string; weightKg: number }>, item: any) => {
                                            const wasteType = item.wasteType || item.WasteType || item.waste_type;
                                            const weightKg = Number(item.weightKg || item.WeightKg || item.weight_kg) || 0;

                                            const existing = acc.find((i: { wasteType: string; weightKg: number }) => i.wasteType === wasteType);
                                            if (existing) {
                                                existing.weightKg += weightKg;
                                            } else {
                                                acc.push({ wasteType, weightKg });
                                            }
                                            return acc;
                                        }, [] as Array<{ wasteType: string; weightKg: number }>)
                                        : [{
                                            wasteType: report.wasteType || (report as any).WasteType || (report as any).waste_type,
                                            weightKg: Number((report.weightKg || (report as any).WeightKg || (report as any).weight_kg) || 0)
                                        }];

                                    return grouped.map((item: { wasteType: string; weightKg: number }, index: number) => (
                                        <View key={index} style={styles.wasteItem}>
                                            <Text style={styles.wasteType}>
                                                {getWasteTypeLabel(item.wasteType)}
                                            </Text>
                                            <Text style={styles.wasteWeight}>{item.weightKg.toFixed(1)} kg</Text>
                                        </View>
                                    ));
                                })()}

                                <View style={styles.divider} />

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Tổng khối lượng</Text>
                                    <Text style={styles.totalValue}>{totalWeight.toFixed(1)} kg</Text>
                                </View>

                                {points !== undefined && (
                                    <View style={styles.pointsRow}>
                                        <Text style={styles.pointsLabel}>Điểm thưởng dự kiến</Text>
                                        <Text style={styles.pointsValue}>+{points} điểm</Text>
                                    </View>
                                )}
                            </View>
                        </Card>

                        {/* Images */}
                        {images && images.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Hình ảnh đính kèm</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                    {images.map((img, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: img }}
                                            style={styles.detailImage}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Cancel Button */}
                        {canCancel && (
                            <TouchableOpacity
                                style={[styles.cancelButton, submitting && styles.disabledButton]}
                                onPress={handleCancel}
                                disabled={submitting}
                            >
                                <Ionicons name="close-circle" size={20} color={AppColors.white} />
                                <Text style={styles.cancelButtonText}>
                                    {submitting ? "Đang xử lý..." : "Hủy báo cáo này"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
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
    loadingContainer: {
        padding: 20,
        alignItems: "center",
    },
    errorContainer: {
        padding: 30,
        alignItems: "center",
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginVertical: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    statusCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: AppColors.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dateContainer: {
        alignItems: "flex-end",
    },
    label: {
        fontSize: 12,
        color: AppColors.textSecondary,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    value: {
        fontSize: 14,
        color: AppColors.textPrimary,
        fontWeight: "600",
    },
    sectionCard: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: AppColors.primary,
        paddingLeft: 10,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        color: AppColors.textPrimary,
        flex: 1,
        lineHeight: 22,
    },
    wasteList: {
        marginTop: 5,
    },
    wasteItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    wasteType: {
        fontSize: 15,
        color: AppColors.textPrimary,
    },
    wasteWeight: {
        fontSize: 15,
        fontWeight: "600",
        color: AppColors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: AppColors.gray[200],
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
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
    pointsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: AppColors.warning + "15",
        padding: 8,
        borderRadius: 8,
    },
    pointsLabel: {
        fontSize: 14,
        color: AppColors.warning,
    },
    pointsValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: AppColors.warning,
    },
    contentBox: {
        marginTop: 5,
        padding: 12,
        backgroundColor: AppColors.gray[50], // Light gray background for content
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray[100],
    },
    contentText: {
        fontSize: 15,
        color: AppColors.textPrimary,
        lineHeight: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 12,
    },
    imageScroll: {
        flexDirection: "row",
    },
    detailImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: AppColors.gray[200],
    },
    bottomSpacer: {
        height: 40,
    },
    userInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: AppColors.gray[200],
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: AppColors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    userMeta: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: AppColors.textPrimary,
    },
    userPhone: {
        fontSize: 14,
        color: AppColors.textSecondary,
    },
    callButton: {
        backgroundColor: AppColors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: AppColors.error,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
        shadowColor: AppColors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    cancelButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
});
