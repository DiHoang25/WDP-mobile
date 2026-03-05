// Types for the ECONNET App

export type UserRole = "citizen" | "enterprise" | "shipper" | "admin";

export type WasteType =
  | "ORGANIC"
  | "RECYCLABLE"
  | "HAZARDOUS";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  roleId: number; // 1: citizen, 2: enterprise, 3: shipper, 4: admin
  avatar?: string;

  // Citizen specific
  address?: string;
  latitude?: number;
  longitude?: number;
  points?: number;
  district?: string;

  // Shipper specific
  vehicleType?: string;
  vehicleNumber?: string;

  status?: string;
}

export interface BackendWasteItem {
  wasteType: string;
  weightKg: number;
}

export interface WasteReport {
  id: string;
  citizenId: string;
  citizenName: string;
  enterpriseName?: string;
  address: string;
  district: string;
  wasteType: string;
  weightKg: number; // kg
  wasteItems?: BackendWasteItem[]; // Added for backend compatibility
  estimatedWeight?: number;
  description?: string;
  content?: string; // Mapped from backend description or content
  images?: string[];
  status: ReportStatus; // Use the type defined below
  createdAt: string | Date;
  updatedAt?: string | Date;
  cancelReason?: string;
  points?: number;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  enterprise?: {
    id: number;
    name: string;
    phone?: string;
    avatar?: string;
  };
  collector?: {
    id: number;
    fullName: string;
    phone?: string;
    avatar?: string;
  };
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  value: number; // VND
  expiryDate: Date;
  brandName: string;
  category: string;
  imageUrl?: string;
  termsAndConditions?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  district: string;
  points: number;
  reportsCount: number;
  avatar?: string;
}

export interface ShipperTask {
  id: string;
  reportId: string;
  shipperId: string;
  status: "assigned" | "in-progress" | "completed";
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  route?: {
    latitude: number;
    longitude: number;
  }[];
}
export interface ServiceArea {
  provinceCode: string;
  districtCode: string;
  wardCode?: string;
}

export type NotificationType = "REPORT_STATUS_CHANGED" | "BROADCAST" | "SYSTEM";

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType | string;
  title: string;
  content: string;
  meta?: {
    action?: string;
    reportId?: number;
    broadcast?: boolean;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BusinessWasteType {
  wasteType: string;
  weightKg?: number; // Added optional for business context if needed
}


export interface BusinessRegistrationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacityKg: number;
  serviceAreas: ServiceArea[];
  wasteTypes: { wasteType: string }[];
  subscriptionPlanConfigId: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  durationMonths: number;
  features?: string[];
  isActive?: boolean;
}

// Report Status Types (matching backend)
export type ReportStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "ON_THE_WAY"
  | "WAITING_CUSTOMER"
  | "COLLECTED"
  | "COMPLETED"
  | "CANCELLED";
