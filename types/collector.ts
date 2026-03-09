// Types for Collector Module

export type CollectorStatus = "OFFLINE" | "AVAILABLE" | "BUSY";

export type TaskStatus = 
  | "PENDING_ACCEPT"     // Chờ collector chấp nhận (5 phút)
  | "ASSIGNED"           // Đã nhận, chưa bắt đầu di chuyển
  | "ON_THE_WAY"         // Đang di chuyển đến địa điểm
  | "ARRIVED"            // Đã đến, đang chờ citizen (20 phút)
  | "COLLECTING"         // Đang thu gom
  | "COMPLETED"          // Hoàn tất
  | "CITIZEN_ABSENT"     // Vắng khách
  | "REPORTED_ISSUE"     // Có sự cố/lừa đảo
  | "EXPIRED"            // Hết thời gian chấp nhận
  | "REJECTED";          // Collector từ chối

export type AccuracyRating = "MATCH" | "MODERATE" | "HEAVY";

export interface Zone {
  id: string;
  name: string;
  districtCode: string;
  wardCode?: string;
  isPrimary: boolean; // Zone chính hay phụ
}

export interface CollectorProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  enterpriseId: string;
  enterpriseName: string;
  
  // Trạng thái làm việc
  status: CollectorStatus;
  currentShiftStartedAt?: string;
  
  // Khu vực làm việc
  zones: Zone[];
  
  // Thống kê
  trustScore: number; // Điểm tin cậy (0-100)
  totalCompleted: number;
  skipCount: number; // Số lần từ chối
  todayTaskCount: number;
  
  // Queue
  queueLength: number; // Số đơn đang có
  maxQueueLength: number; // Tối đa (thường là 6)
  
  // Vị trí hiện tại
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface CollectorTask {
  id: string;
  reportId: string;
  
  // Thông tin địa điểm
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number; // Khoảng cách từ vị trí collector
  
  // Thông tin rác
  wasteTypes: string[]; // ["ORGANIC", "RECYCLABLE"]
  estimatedWeightKg: number;
  description?: string;
  images: string[];
  
  // Thông tin citizen
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  
  // Trạng thái task
  status: TaskStatus;
  
  // Thời gian
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedMovingAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  
  // Deadline cho các giai đoạn
  acceptDeadline?: string; // 5 phút sau khi assignedAt
  waitingDeadline?: string; // 20 phút sau khi arrivedAt
  
  // Xác nhận từ citizen
  citizenConfirmedPresence: boolean;
  citizenConfirmedAt?: string;
  
  // Kết quả thu gom
  actualWeightKg?: number;
  accuracyRating?: AccuracyRating;
  collectionImages?: string[];
  
  // Báo cáo sự cố
  issueDescription?: string;
  issueImages?: string[];
  
  // Metadata
  zone?: Zone;
}

export interface ShiftControlData {
  collectorId: string;
  status: CollectorStatus;
  currentLatitude: number;
  currentLongitude: number;
  isInPrimaryZone: boolean;
  zoneName?: string;
}

export interface TaskAction {
  taskId: string;
  action: 
    | "accept" 
    | "reject" 
    | "start_moving" 
    | "checkin" 
    | "complete" 
    | "report_absent" 
    | "report_issue";
  data?: any;
}

export interface CompleteTaskData {
  actualWeightKg: number;
  accuracyRating: AccuracyRating;
  collectionImages: string[]; // Min 1 ảnh
}

export interface ReportAbsentData {
  note?: string;
}

export interface ReportIssueData {
  description: string; // Min 5 ký tự
  issueImages: string[]; // Min 1 ảnh bắt buộc
}

export interface CollectorNotification {
  id: string;
  type: "NEW_TASK" | "TASK_COMPLETED" | "WARNING" | "SYSTEM" | "CITIZEN_PRESENT";
  title: string;
  content: string;
  taskId?: string;
  createdAt: string;
  isRead: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface TaskTimer {
  taskId: string;
  deadline: string;
  remainingSeconds: number;
  type: "ACCEPT" | "WAITING";
}
