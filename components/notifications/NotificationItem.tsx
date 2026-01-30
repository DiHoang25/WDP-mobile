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
        switch (type) {
            case "REPORT_STATUS_CHANGED":
                return AppColors.primary;
            case "BROADCAST":
                return AppColors.warning;
            default:
                return AppColors.secondary;
        }
    };

    const getSenderName = () => {
        if (type === "BROADCAST" || type === "SYSTEM") return "HỆ THỐNG";
        if (type === "REPORT_STATUS_CHANGED") {
            // Ưu tiên sử dụng enterpriseName từ meta.
            return notification.meta?.enterprise?.name || notification.meta?.enterpriseName || notification.meta?.senderName || "DOANH NGHIỆP";
        }
        return "THÔNG BÁO";
    };

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

    return (
        <TouchableOpacity
            style={[styles.container, !isRead && styles.unreadContainer]}
            onPress={() => onPress(notification)}
            activeOpacity={0.7}
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
                <Text style={[styles.title, !isRead && styles.unreadText]}>{title}</Text>
                <Text style={[styles.content, !isRead && styles.unreadText]}>
                    {content}
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
