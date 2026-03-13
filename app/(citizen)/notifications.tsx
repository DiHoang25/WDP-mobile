import { EmptyState, Header } from "@/components/common";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { AppColors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { notificationService } from "@/services/notification.service";
import { Notification } from "@/types";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NotificationsScreen() {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchNotifications = async (
        pageNum: number,
        shouldRefresh = false,
        currentFilter = filter
    ) => {
        try {
            if (pageNum === 1) setLoading(true);

            const isRead = currentFilter === "unread" ? false : undefined;
            const response = await notificationService.getNotifications(pageNum, 20, isRead);

            if (response.success && response.data) {
                const newNotifications = response.data.data;
                const pagination = response.data.pagination;

                if (shouldRefresh) {
                    setNotifications(newNotifications);
                } else {
                    setNotifications((prev) => [...prev, ...newNotifications]);
                }

                setHasMore(pageNum < pagination.totalPages);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Fetch notifications error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchNotifications(1, true);
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications(1, true);
    };

    const onLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            fetchNotifications(page + 1);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                // Update local state to reflect read status
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    )
                );
            } catch (error) {
                console.error("Mark as read error:", error);
            }
        }

        // Navigate based on type
        if (notification.meta?.reportId) {
            router.push({
                pathname: "/report-detail",
                params: {
                    id: notification.meta.reportId,
                    content: notification.content,
                    senderName: notification.meta?.enterprise?.name || notification.meta?.enterpriseName || notification.meta?.senderName || ""
                }
            });
        }
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Header title={t("notifications.title")} showBack={true} />

            <View style={styles.filterTabs}>
                <TouchableOpacity
                    style={[styles.tab, filter === "all" && styles.activeTab]}
                    onPress={() => setFilter("all")}
                >
                    <Text style={[styles.tabText, filter === "all" && styles.activeTabText]}>
                        {t("common.all")}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === "unread" && styles.activeTab]}
                    onPress={() => setFilter("unread")}
                >
                    <Text style={[styles.tabText, filter === "unread" && styles.activeTabText]}>
                        {t("notifications.unread")}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing && page === 1 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={({ item }) => (
                        <NotificationItem
                            notification={item}
                            onPress={handleNotificationPress}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[AppColors.primary]}
                        />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        !loading ? (
                            <EmptyState
                                icon="notifications-off-outline"
                                title={t("notifications.noNotifications")}
                                message={
                                    filter === "unread"
                                        ? t("notifications.allRead")
                                        : t("notifications.noNotificationsYet")
                                }
                            />
                        ) : null
                    }
                    contentContainerStyle={
                        notifications.length === 0 ? styles.emptyList : undefined
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    filterTabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[200],
    },
    tab: {
        marginRight: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: AppColors.primary + "20", // 20% opacity
    },
    tabText: {
        fontSize: 15,
        fontWeight: "600",
        color: AppColors.textSecondary,
    },
    activeTabText: {
        color: AppColors.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: "center",
    },
});
