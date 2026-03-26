import { GlobalNotificationBanner } from '@/components/common';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    notifications: Notification[];
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
    const seenNotificationIds = useRef<Set<number>>(new Set());
    const isFirstLoad = useRef(true);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;

        try {
            const response = await notificationService.getNotifications(1, 10);
            if (response.success && response.data) {
                const newNotifications = response.data.data;
                setNotifications(newNotifications);
                setUnreadCount(response.data.pagination.total);

                // Check for new ASSIGNED/ACCEPTED notifications
                if (newNotifications.length > 0) {
                    const latest = newNotifications[0];

                    // Only notify if it's unread, truly new in this session, and of interest
                    // AND it's not the first load (to avoid spamming old notifications on app start)
                    if (!seenNotificationIds.current.has(latest.id)) {
                        if (!isFirstLoad.current && !latest.isRead) {
                            // Refined logic based on User Request:
                            // Citizen (Role 1): Show if status is ASSIGNED
                            // Collector (Role 3): Show if status is COLLECTOR_PENDING (or NEW_TASK)
                            const contentLower = latest.content.toLowerCase();
                            const titleLower = latest.title.toLowerCase();

                            let shouldShow = false;
                            if (user?.roleId === 1) {
                                // Citizen
                                shouldShow = contentLower.includes('assigned') ||
                                    contentLower.includes('đã nhận đơn') ||
                                    contentLower.includes('sự cố') ||
                                    contentLower.includes('khiếu nại') ||
                                    contentLower.includes('chấp nhận') ||
                                    contentLower.includes('từ chối') ||
                                    titleLower.includes('assigned') ||
                                    titleLower.includes('sự cố') ||
                                    titleLower.includes('khiếu nại');
                            } else if (user?.roleId === 3) {
                                // Collector
                                shouldShow = contentLower.includes('collector_pending') ||
                                    contentLower.includes('đơn hàng mới') ||
                                    latest.type === 'TASK_ASSIGNED' ||
                                    latest.type === 'NEW_TASK';
                            }

                            if (shouldShow) {
                                const meta = latest.meta || (latest as any).data || {};
                                const metaType = String(meta.type || "").toUpperCase();
                                const titleStr = latest.title.toLowerCase();
                                const contentStr = latest.content.toLowerCase();
                                const isIncident = metaType === "DISPUTE_REPORTED" ||
                                    titleStr.includes('sự cố') || contentStr.includes('sự cố') ||
                                    titleStr.includes('khiếu nại') || contentStr.includes('khiếu nại');

                                if (isIncident) {
                                    setLatestNotification({
                                        ...latest,
                                        title: "Hệ thống",
                                        content: "Báo cáo của bạn đã được xử lý.Vui lòng vào 'Lịch sử khiếu nại' để xem chi tiết."
                                    });
                                } else {
                                    setLatestNotification(latest);
                                }
                            }
                        }
                        seenNotificationIds.current.add(latest.id);
                    }
                }
                isFirstLoad.current = false;
            }
        } catch (error) {
            console.error('Error fetching notifications in provider:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
            seenNotificationIds.current.clear();
            isFirstLoad.current = true;
        }
    }, [isAuthenticated]);

    const handleBannerPress = () => {
        if (!latestNotification) return;

        const meta = latestNotification.meta || (latestNotification as any).data || {};
        const metaType = String(meta.type || "").toUpperCase();
        const complaintId = meta.complaintId || meta.complaint_id || meta.complaintID;
        const reportId = meta.reportId || meta.report_id || meta.reportID || meta.id;

        const titleStr = String(latestNotification.title || "").toLowerCase();
        const contentStr = String(latestNotification.content || "").toLowerCase();
        const isIncident = metaType === "DISPUTE_REPORTED" ||
            titleStr.includes("khiếu nại") || contentStr.includes("khiếu nại") ||
            titleStr.includes("sự cố") || contentStr.includes("sự cố") ||
            titleStr.includes("hệ thống");

        if (isIncident) return; // Disable click for incidents

        if (user?.roleId === 3) {
            // Shipper/Collector
            if (reportId) {
                router.push({
                    pathname: "/(collectors)/task-detail",
                    params: { id: String(reportId), reportId: String(reportId) }
                } as any);
            }
        } else {
            // Citizen
            if (complaintId) {
                router.push({
                    pathname: "/(citizen)/complaint-detail",
                    params: { complaintId: String(complaintId) }
                } as any);
            } else if (isIncident && reportId) {
                router.push({
                    pathname: "/(citizen)/complaint-detail",
                    params: { complaintId: `r${reportId}` }
                } as any);
            } else if (reportId) {
                router.push({
                    pathname: "/report-detail",
                    params: { id: String(reportId) }
                });
            }
        }

        setLatestNotification(null);
    };

    const handleBannerClose = () => {
        setLatestNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ unreadCount, notifications, refreshNotifications: fetchNotifications }}>
            {children}
            {latestNotification && (
                <GlobalNotificationBanner
                    notification={latestNotification}
                    onPress={handleBannerPress}
                    onClose={handleBannerClose}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
