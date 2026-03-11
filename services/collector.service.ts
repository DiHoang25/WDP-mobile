import {
  CollectorProfile,
  CollectorStatus,
  CollectorTask,
  CollectorTaskItem,
  CompleteTaskData,
  ReportAbsentData,
  ReportIssueData
} from "@/types/collector";
import { apiClient } from "@/utils/api";

/**
 * Collector Service
 * Handles all collector-related API calls
 */

export const collectorService = {
  /**
   * Lấy thông tin profile của collector
   */
  async getProfile(): Promise<CollectorProfile> {
    const response = await apiClient.get<CollectorProfile>("/collectors/profile");
    return response.data as CollectorProfile;
  },

  /**
   * Cập nhật trạng thái ca làm (ONLINE/OFFLINE)
   */
  async updateStatus(availability: CollectorStatus): Promise<{ success: boolean }> {
    const response = await apiClient.patch<any>("/collectors/status", {
      availability,
      latitude: null,
      longitude: null,
      deviceId: null,
    });
    console.log("📡 updateStatus response:", JSON.stringify(response));
    return { success: response.success };
  },

  /**
   * Cập nhật trạng thái task (ON_THE_WAY, ARRIVED, COMPLETED, etc.)
   */
  async updateTaskStatus(taskId: number, status: string, data?: any): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.patch<any>(`/collectors/tasks/${taskId}/status`, {
      status,
      ...data,
    });
    console.log("📡 updateTaskStatus response:", JSON.stringify(response));
    return { success: response.success, message: response.message };
  },

  /**
   * Lấy danh sách task đang chờ xác nhận
   */
  async getTasks(): Promise<CollectorTaskItem[]> {
    const response = await apiClient.get<CollectorTaskItem[]>("/collectors/tasks");
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  /**
   * Lấy danh sách task đã chấp nhận (đang xử lý)
   */
  async getAcceptedTasks(): Promise<CollectorTaskItem[]> {
    const response = await apiClient.get<any>("/collectors/reports/accepted");
    if (response.success) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data && Array.isArray(response.data.data)) return response.data.data;
    }
    return [];
  },

  /**
   * Lấy lịch sử task đã hoàn thành
   */
  async getCompletedTasks(): Promise<any[]> {
    const response = await apiClient.get<any>("/collectors/reports/history");
    if (response.success) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data && Array.isArray(response.data.data)) return response.data.data;
    }
    return [];
  },

  async respondTask(taskId: number, accept: boolean): Promise<{ success: boolean; message?: string }> {
    try {
      const endpoint = accept
        ? `/collectors/tasks/${taskId}/accept`
        : `/collectors/tasks/${taskId}/reject`;
      console.log(`📡 Calling respondTask API: PATCH ${endpoint}`);
      const response = await apiClient.patch<any>(endpoint);
      console.log("📡 respondTask API response:", JSON.stringify(response));
      // API might return standard wrapper or just 200 OK. If no error is thrown, it's generally a success
      const isSuccess = response?.success !== false;
      return { success: isSuccess, message: response?.message };
    } catch (error: any) {
      console.error("📡 respondTask API error:", error);
      return { success: false, message: error?.message || "Lỗi không xác định" };
    }
  },

  /**
   * Lấy chi tiết một Đơn hàng (theo ID mới)
   */
  async getTaskById(taskId: number): Promise<CollectorTaskItem> {
    const acceptedTasks = await this.getAcceptedTasks();
    const task = acceptedTasks.find((t: any) => t.id === taskId);
    if (task) {
      return task as CollectorTaskItem;
    }
    throw new Error("Không tìm thấy Đơn hàng");
  },

  /**
   * Lấy chi tiết một Đơn hàng (legacy)
   */
  async getTaskDetail(taskId: string): Promise<CollectorTask> {
    const response = await apiClient.get<CollectorTask>(`/collector/tasks/${taskId}`);
    return response.data as CollectorTask;
  },

  /**
   * Chấp nhận Đơn hàng (trong vòng 5 phút)
   */
  async acceptTask(taskId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/collector/tasks/${taskId}/accept`);
    return response.data as { success: boolean };
  },

  /**
   * Từ chối Đơn hàng
   */
  async rejectTask(taskId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/collector/tasks/${taskId}/reject`, {
      reason,
    });
    return response.data as { success: boolean };
  },

  /**
   * Bắt đầu di chuyển đến địa điểm
   */
  async startMoving(reportId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.patch<any>(`/collectors/reports/${reportId}/on-the-way`);
      console.log("📡 startMoving response:", JSON.stringify(response));
      return { success: response?.success !== false, message: response?.message };
    } catch (error: any) {
      console.error("📡 startMoving error:", error);
      return { success: false, message: error?.message || "Lỗi khi cập nhật trạng thái di chuyển" };
    }
  },

  /**
   * Check-in đã đến nơi (validate GPS trong 300m)
   */
  async checkinArrived(
    taskId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ success: boolean; distance?: number }> {
    const response = await apiClient.post<{ success: boolean; distance?: number }>(`/collector/tasks/${taskId}/checkin`, {
      latitude,
      longitude,
    });
    return response.data as { success: boolean; distance?: number };
  },

  /**
   * Hoàn tất thu gom
   */
  async completeTask(
    taskId: string,
    data: CompleteTaskData,
  ): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append("actualWeightKg", data.actualWeightKg.toString());
    formData.append("accuracyRating", data.accuracyRating);

    // Upload ảnh
    data.collectionImages.forEach((imageUri, index) => {
      formData.append("images", {
        uri: imageUri,
        type: "image/jpeg",
        name: `collection_${index}.jpg`,
      } as any);
    });

    const response = await apiClient.postFormData<{ success: boolean }>(
      `/collector/tasks/${taskId}/complete`,
      formData
    );
    return response.data as { success: boolean };
  },

  /**
   * Báo vắng khách (sau 20 phút chờ)
   */
  async reportAbsent(
    taskId: string,
    data: ReportAbsentData,
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/collector/tasks/${taskId}/absent`, data);
    return response.data as { success: boolean };
  },

  /**
   * Báo cáo sự cố/lừa đảo
   */
  async reportIssue(
    taskId: string,
    data: ReportIssueData,
  ): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append("description", data.description);

    // Upload ảnh bằng chứng
    data.issueImages.forEach((imageUri, index) => {
      formData.append("images", {
        uri: imageUri,
        type: "image/jpeg",
        name: `issue_${index}.jpg`,
      } as any);
    });

    const response = await apiClient.postFormData<{ success: boolean }>(
      `/collector/tasks/${taskId}/report-issue`,
      formData
    );
    return response.data as { success: boolean };
  },

  /**
   * Lấy lịch sử Đơn hàng
   */
  async getTaskHistory(page: number = 1, limit: number = 20): Promise<{
    tasks: CollectorTask[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get<{
      tasks: CollectorTask[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/collector/tasks/history?page=${page}&limit=${limit}`);
    return response.data as {
      tasks: CollectorTask[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  },

  /**
   * Cập nhật vị trí hiện tại (real-time tracking)
   */
  async updateLocation(latitude: number, longitude: number): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>("/collector/location", {
      latitude,
      longitude,
    });
    return response.data as { success: boolean };
  },

  /**
   * Lấy thống kê của collector
   */
  async getStats(): Promise<{
    trustScore: number;
    totalCompleted: number;
    skipCount: number;
    todayTaskCount: number;
    queueLength: number;
  }> {
    const response = await apiClient.get<{
      trustScore: number;
      totalCompleted: number;
      skipCount: number;
      todayTaskCount: number;
      queueLength: number;
    }>("/collector/stats");
    return response.data as {
      trustScore: number;
      totalCompleted: number;
      skipCount: number;
      todayTaskCount: number;
      queueLength: number;
    };
  },
};
