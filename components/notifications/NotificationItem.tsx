import { AppColors } from "@/constants/theme";
import { Notification } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onPress,
}) => {
    const { isRead, title, content, createdAt, type } = notification;

    const getIcon = () => {
        if (isIncident) return "warning";
        switch (type) {
            case "REPORT_STATUS_CHANGED":
                return "document-text";
            case "BROADCAST":
                return "megaphone";
            default:
                return "notifications";
        }
    };

    const getIconColor = () => {
        if (isIncident) return AppColors.error;
        switch (type) {
            case "REPORT_STATUS_CHANGED":
                return AppColors.primary;
            case "BROADCAST":
                return AppColors.warning;
            default:
                return AppColors.secondary;
        }
    };

    const meta = notification.meta || (notification as any).data || {};
    const metaType = String(meta.type || "").toUpperCase();

    const isIncident = metaType === "DISPUTE_REPORTED" ||
        (title || "").toLowerCase().includes("sự cố") ||
        (content || "").toLowerCase().includes("sự cố") ||
        (title || "").toLowerCase().includes("khiếu nại") ||
        (content || "").toLowerCase().includes("khiếu nại");

    const getSenderName = () => {
        if (isIncident) return "HỆ THỐNG";
        if (type === "BROADCAST" || type === "SYSTEM") return "HỆ THỐNG";
        if (type === "REPORT_STATUS_CHANGED") {
            // Ưu tiên sử dụng enterpriseName từ meta.
            return notification.meta?.enterprise?.name || notification.meta?.enterpriseName || notification.meta?.senderName || "DOANH NGHIỆP";
        }
        return "THÔNG BÁO";
    };

    const displayTitle = isIncident ? "Báo cáo sự cố" : title;
    const displayContent = isIncident ? "Báo cáo của bạn đã được xử lý. Cảm ơn bạn đã phản hồi để hệ thống tốt hơn!" : content;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    // Dịch các status raw trong nội dung thông báo
    const translateContent = (text: string) => {
        const statusMap: Record<string, string> = {
            "COLLECTOR_PENDING": "Đang chờ xác nhận",
            "PENDING_COLLECTOR": "Đang chờ xác nhận",
            "PENDING": "Đang chờ xử lý",
            "ACCEPTED": "Đã chấp nhận",
            "REJECTED": "Đã từ chối",
            "ON_THE_WAY": "Đang di chuyển",
            "ARRIVED": "Đã đến nơi",
            "COLLECTED": "Đã thu gom",
            "COMPLETED": "Hoàn thành",
            "CANCELLED": "Đã huỷ",
            "EXPIRED": "Hết hạn",
            "CITIZEN_ABSENT": "Vắng khách",
            "REPORTED_ISSUE": "Có sự cố",
            "ENTERPRISE_PENDING": "Chờ doanh nghiệp",
            "ENTERPRISE_ACCEPTED": "Doanh nghiệp đã nhận",
            "ENTERPRISE_REJECTED": "Doanh nghiệp từ chối",
            "IN_PROGRESS": "Đang xử lý",
            "VERIFIED": "Đã xác minh",
            "APPROVED": "Đã duyệt",
            "PROCESSING": "Đang xử lý",
        };

        let result = text;
        for (const [eng, vi] of Object.entries(statusMap)) {
            result = result.replace(new RegExp(eng, "gi"), vi);
        }
        return result;
    };

    return (
        <TouchableOpacity
            style={[styles.container, !isRead && styles.unreadContainer]}
            onPress={() => !isIncident && onPress(notification)}
            activeOpacity={isIncident ? 1 : 0.7}
        >
            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: getIconColor() + "20" }]}>
                    <Ionicons name={getIcon() as any} size={24} color={getIconColor()} />
                </View>
                {!isRead && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.senderName}>{getSenderName()}</Text>
                    <Text style={styles.time}>{formatTime(createdAt)}</Text>
                </View>
                <Text style={[styles.title, !isRead && styles.unreadText]}>{translateContent(displayTitle)}</Text>
                <Text style={[styles.content, !isRead && styles.unreadText]}>
                    {translateContent(displayContent)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: AppColors.white,
        alignItems: "flex-start",
    },
    unreadContainer: {
        backgroundColor: "#E7F3FF", // Light blue tint for unread
    },
    iconContainer: {
        position: "relative",
        marginRight: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    unreadDot: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: AppColors.primary,
        borderWidth: 2,
        borderColor: AppColors.white,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
        alignItems: "center",
    },
    senderName: {
        fontSize: 12,
        fontWeight: "bold",
        color: AppColors.textSecondary,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.textPrimary,
        marginBottom: 4,
    },
    content: {
        fontSize: 14,
        color: AppColors.textSecondary,
        marginBottom: 6,
        lineHeight: 20,
    },
    unreadText: {
        color: AppColors.textPrimary,
        fontWeight: "bold"
    },
    time: {
        fontSize: 12,
        color: AppColors.textSecondary,
    },
});
