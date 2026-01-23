// Types for the EcoCollect App

export type UserRole = "citizen" | "enterprise" | "shipper" | "admin";

export type WasteType =
  | "organic"
  | "plastic"
  | "paper"
  | "metal"
  | "glass"
  | "electronic"
  | "hazardous"
  | "mixed";

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
}

export interface BackendWasteItem {
  wasteType: string;
  weight: number;
}

export interface WasteReport {
  id: string;
  citizenId: string;
  citizenName: string;
  address: string;
  district: string;
  wasteType: string;
  weight: number; // kg
  wasteItems?: BackendWasteItem[]; // Added for backend compatibility
  estimatedWeight?: number;
  description?: string;
  images?: string[];
  status: "pending" | "assigned" | "collected" | "completed";
  createdAt: string | Date; // Backend usually returns ISO string
  collectedAt?: string | Date;
  assignedShipperId?: string;
  points?: number;
  location?: {
    latitude: number;
    longitude: number;
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

export interface BusinessWasteType {
  wasteType: string;
}

export interface WorkingHour {
  startTime: string;
  endTime: string;
}

export interface BusinessRegistrationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacityKg: number;
  serviceAreas: ServiceArea[];
  wasteTypes: BusinessWasteType[];
  workingHour: WorkingHour;
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
