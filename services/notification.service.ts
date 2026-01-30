import { NotificationResponse } from '@/types';
import { apiClient, ApiResponse } from '@/utils/api';

export const notificationService = {
    /**
     * Get notifications list
     * GET /api/v1/notifications
     */
    getNotifications: async (page = 1, limit = 20, isRead?: boolean): Promise<ApiResponse<NotificationResponse>> => {
        let url = `/notifications?page=${page}&limit=${limit}`;
        if (isRead !== undefined) {
            url += `&isRead=${isRead}`;
        }
        return apiClient.get<NotificationResponse>(url);
    },

    /**
     * Mark notification as read
     * PATCH /api/v1/notifications/:id/read
     */
    markAsRead: async (id: number): Promise<ApiResponse<any>> => {
        return apiClient.patch<any>(`/notifications/${id}/read`, {});
    },

    /**
     * Count unread notifications
     * Uses getNotifications with limit=1 and isRead=false to get total from pagination
     */
    countUnread: async (): Promise<number> => {
        try {
            const response = await apiClient.get<NotificationResponse>('/notifications?page=1&limit=1&isRead=false');
            if (response.success && response.data) {
                return response.data.pagination.total;
            }
            return 0;
        } catch (error) {
            console.error("Error counting unread notifications:", error);
            return 0;
        }
    }
};
