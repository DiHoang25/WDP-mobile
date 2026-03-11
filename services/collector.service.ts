import {
  AccuracyRating,
  CollectorProfile,
  CollectorStatus,
  CollectorTask,
  CompleteTaskData,
  ReportAbsentData,
  ReportIssueData,
  ShiftControlData,
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
    const response = await apiClient.get<CollectorProfile>("/collector/profile");
    return response.data as CollectorProfile;
  },

  /**
   * Cập nhật trạng thái ca làm (ONLINE/OFFLINE)
   */
  async updateShiftStatus(data: ShiftControlData): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>("/collector/shift/status", data);
    return response.data as { success: boolean };
  },

  /**
   * Lấy danh sách nhiệm vụ đang chờ
   */
  async getPendingTasks(): Promise<CollectorTask[]> {
    const response = await apiClient.get<CollectorTask[]>("/collector/tasks/pending");
    return response.data as CollectorTask[];
  },

  /**
   * Lấy danh sách nhiệm vụ đã nhận (assigned/in-progress)
   */
  async getActiveTasks(): Promise<CollectorTask[]> {
    const response = await apiClient.get<CollectorTask[]>("/collector/tasks/active");
    return response.data as CollectorTask[];
  },

  /**
   * Lấy chi tiết một nhiệm vụ
   */
  async getTaskDetail(taskId: string): Promise<CollectorTask> {
    const response = await apiClient.get<CollectorTask>(`/collector/tasks/${taskId}`);
    return response.data as CollectorTask;
  },

  /**
   * Chấp nhận nhiệm vụ (trong vòng 5 phút)
   */
  async acceptTask(taskId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/collector/tasks/${taskId}/accept`);
    return response.data as { success: boolean };
  },

  /**
   * Từ chối nhiệm vụ
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
  async startMoving(taskId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/collector/tasks/${taskId}/start-moving`);
    return response.data as { success: boolean };
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
   * Lấy lịch sử nhiệm vụ
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
