// Types for Collector Module

export type CollectorStatus = "OFFLINE" | "ONLINE_AVAILABLE" | "AVAILABLE" | "BUSY" | "ONLINE_BUSY";

export interface WorkingDay {
  start: string;
  end: string;
  active: boolean;
}

export interface WorkingHours {
  Monday: WorkingDay;
  Tuesday: WorkingDay;
  Wednesday: WorkingDay;
  Thursday: WorkingDay;
  Friday: WorkingDay;
  Saturday: WorkingDay;
  Sunday: WorkingDay;
}

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
  id: number;
  employeeCode: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  enterprise: {
    name: string;
  };
  status: {
    availability: CollectorStatus;
  };
  workingHours: WorkingHours;

  // Legacy/Additional fields (keep optional for now)
  trustScore?: number;
  totalCompleted?: number;
  skipCount?: number;
  todayTaskCount?: number;
  queueLength?: number;
  maxQueueLength?: number;
  zones?: Zone[];
}

// ===== New API-based Task Types =====

export interface TaskWasteItem {
  wasteType: string;
  weightKg: number;
}

export interface TaskReportImage {
  id: number;
  reportId: number;
  imageUrl: string;
}

export interface TaskCitizen {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  avatar: string | null;
}

export interface TaskReport {
  id: number;
  citizenId: number;
  currentEnterpriseId: number | null;
  address: string;
  latitude: number;
  longitude: number;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  description: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  arrivedAt: string | null;
  arrivalDeadline: string | null;
  collectedAt: string | null;
  completedAt: string | null;
  actualWeight: number | null;
  accuracyBucket: string | null;
  evidenceImages: string[] | null;
  cancelReason: string | null;
  citizenConfirmedAt: string | null;
  citizenAbsentAt: string | null;
  deletedAt: string | null;
  images: TaskReportImage[];
  citizen: TaskCitizen;
  wasteItems: TaskWasteItem[];
}

export type CollectorTaskStatus =
  | "PENDING_COLLECTOR"
  | "COLLECTOR_PENDING"
  | "ACCEPTED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "COLLECTING"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED";

export interface CollectorTaskItem {
  id: number;
  reportId: number;
  collectorId: number;
  enterpriseId: number;
  status: CollectorTaskStatus;
  attemptOrder: number;
  expiredAt: string;
  respondedAt: string | null;
  createdAt: string;
  report: TaskReport;
}

export interface HistoryWasteItem {
  type: string;
  weight: number;
}

export interface HistoryReportItem {
  reportId: number;
  address: string;
  completedAt: string;
  actualWeight: number;
  wasteItems: HistoryWasteItem[];
}

// ===== Legacy types (keep for backward compat) =====

export interface CollectorTask {
  id: string;
  reportId: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  wasteTypes: string[];
  estimatedWeightKg: number;
  description?: string;
  images: string[];
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  status: TaskStatus;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedMovingAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  acceptDeadline?: string;
  waitingDeadline?: string;
  citizenConfirmedPresence: boolean;
  citizenConfirmedAt?: string;
  actualWeightKg?: number;
  accuracyRating?: AccuracyRating;
  collectionImages?: string[];
  issueDescription?: string;
  issueImages?: string[];
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
