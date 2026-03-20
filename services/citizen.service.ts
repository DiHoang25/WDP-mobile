import { ApiResponse, apiClient } from "@/utils/api";

// ========================
// Leaderboard Types
// ========================
export enum LeaderboardCategory {
  POINTS = "POINTS",
  ECO_WARRIORS = "ECO_WARRIORS",
  WASTE_IMPACT = "WASTE_IMPACT",
}

export enum LeaderboardTimeframe {
  ALL_TIME = "ALL_TIME",
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY",
}

export interface LeaderboardRank {
  rank: number;
  userId: number;
  fullName: string;
  avatar: string | null;
  value: number;
}

export interface LeaderboardResponse {
  category: LeaderboardCategory;
  timeframe: LeaderboardTimeframe;
  topRankings: LeaderboardRank[];
  myRank: LeaderboardRank | null;
}

// ========================
// Loyalty/Gift Types
// ========================
export interface Gift {
  id: number;
  name: string;
  type: GiftType;
  description?: string;
  requiredPoints: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemGiftRequest {
  giftId: number;
}

export type PointTransactionType = "EARN" | "SPEND" | "COMPENSATION";
export type GiftType = "FOOD" | "SHOPPING" | "OTHER";
export type WasteType = "ORGANIC" | "RECYCLABLE" | "HAZARDOUS";
export type AccuracyBucket = "MATCH" | "MODERATE" | "HEAVY";
export type ComplaintType =
  | "ATTITUDE"
  | "WEIGHT_MISMATCH"
  | "UNAUTHORIZED_FEE"
  | "NO_SHOW"
  | "OTHER";

export interface EarnBreakdownItem {
  wasteType: WasteType;
  weightKg: number;
  basePoints: number;
  accuracyMultiplier: number;
  wasteMultiplier: number;
  pointsEarned: number;
}

export interface PointTransactionBreakdown {
  source: "REPORT" | "GIFT_REDEEM";
  reportId?: number;
  accuracyBucket?: AccuracyBucket;
  accuracyMultiplier?: number;
  items?: EarnBreakdownItem[];
  gift?: {
    id: number;
    name: string;
    type: GiftType;
    imageUrl?: string;
    requiredPoints: number;
  };
}

export interface PointTransaction {
  id: number;
  userId: number;
  giftId?: number | null;
  reportId?: number | null;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  gift?: Gift | null;
  breakdown?: PointTransactionBreakdown | null;
}

export interface MyPointsResponse {
  points: number;
}

export interface CreateComplaintRequest {
  reportId: number;
  content: string;
  type?: ComplaintType;
  files?: string[];
}

export interface ComplaintItem {
  id: number;
  reportId: number;
  type: ComplaintType;
  typeLabel?: string;
  status: "OPEN" | "PROCESSED" | "REJECTED";
  content: string;
  evidenceImages: string[];
  adminResponse?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ========================
// Citizen Service
// ========================
export const citizenService = {
  /**
   * ===========================
   * LEADERBOARD API
   * ===========================
   */

  /**
   * Get leaderboard rankings
   * GET /api/v1/citizen/leaderboard
   */
  async getLeaderboard(
    category: LeaderboardCategory = LeaderboardCategory.POINTS,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
  ): Promise<ApiResponse<LeaderboardResponse>> {
    return apiClient.get<LeaderboardResponse>(
      `/citizen/leaderboard?category=${category}&timeframe=${timeframe}`,
    );
  },

  /**
   * ===========================
   * LOYALTY / GIFTS API
   * ===========================
   */

  /**
   * Get available gifts list
   * GET /api/v1/citizen/gifts
   */
  async getGifts(): Promise<ApiResponse<Gift[]>> {
    return apiClient.get<Gift[]>("/citizen/gifts");
  },

  /**
   * Redeem a gift with points
   * POST /api/v1/citizen/gifts/redeem
   */
  async redeemGift(
    data: RedeemGiftRequest,
  ): Promise<ApiResponse<PointTransaction>> {
    return apiClient.post<PointTransaction>("/citizen/gifts/redeem", data);
  },

  /**
   * Get my redemption history / point transactions
   * GET /api/v1/citizen/gifts/redemptions?type=EARN|SPEND|COMPENSATION
   * @param type - Optional filter by transaction type (EARN, SPEND, COMPENSATION)
   */
  async getMyRedemptions(
    type?: PointTransactionType,
  ): Promise<ApiResponse<PointTransaction[]>> {
    const queryParam = type ? `?type=${type}` : "";
    return apiClient.get<PointTransaction[]>(
      `/citizen/gifts/redemptions${queryParam}`,
    );
  },

  /**
   * Get my current points balance
   * GET /api/v1/citizen/loyalty/points
   */
  async getMyPoints(): Promise<ApiResponse<MyPointsResponse>> {
    return apiClient.get<MyPointsResponse>("/citizen/loyalty/points");
  },

  /**
   * Create complaint for a report
   * POST /api/v1/citizen/complaints
   */
  async createComplaint(
    data: CreateComplaintRequest,
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("reportId", data.reportId.toString());
    formData.append("type", data.type || "OTHER");
    formData.append("content", data.content);

    if (data.files && data.files.length > 0) {
      data.files.forEach((fileUri, index) => {
        const filename = fileUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("files", {
          uri: fileUri,
          name: filename || `complaint_${index}.jpg`,
          type,
        } as any);
      });
    }

    return apiClient.postFormData<any>("/citizen/complaints", formData);
  },

  /**
   * Get my complaints list
   * GET /api/v1/citizen/complaints
   */
  async getMyComplaints(): Promise<ApiResponse<ComplaintItem[]>> {
    return apiClient.get<ComplaintItem[]>("/citizen/complaints");
  },

  /**
   * ===========================
   * REPORT INTERACTIONS API
   * ===========================
   */

  /**
   * Citizen confirms presence at collection point
   * PATCH /citizen/reports/:reportId/confirm-presence
   */
  async confirmPresence(reportId: number): Promise<ApiResponse<any>> {
    return apiClient.patch<any>(
      `/citizen/reports/${reportId}/confirm-presence`,
    );
  },

  /**
   * Citizen reports being absent
   * PATCH /citizen/reports/:reportId/report-absent
   */
  async reportAbsent(reportId: number): Promise<ApiResponse<any>> {
    return apiClient.patch<any>(`/citizen/reports/${reportId}/report-absent`);
  },
};
