import { ApiResponse, apiClient } from "@/utils/api";

// ========================
// Complaint Types
// ========================
export interface CreateComplaintRequest {
  reportId: number;
  content: string;
}

export interface Complaint {
  id: number;
  reportId: number;
  citizenId: number;
  content: string;
  status: "OPEN" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  report?: any;
}

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

export type PointTransactionType = "EARN" | "SPEND" | "REFUND";

export interface PointTransaction {
  id: number;
  userId: number;
  giftId?: number;
  reportId?: number;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  gift?: Gift;
}

export interface MyPointsResponse {
  points: number;
}

// ========================
// Citizen Service
// ========================
export const citizenService = {
  /**
   * ===========================
   * COMPLAINTS API
   * ===========================
   */

  /**
   * Create a new complaint
   * POST /api/v1/citizen/complaints
   */
  async createComplaint(
    data: CreateComplaintRequest,
  ): Promise<ApiResponse<Complaint>> {
    return apiClient.post<Complaint>("/citizen/complaints", data);
  },

  /**
   * Get my complaints list
   * GET /api/v1/citizen/complaints
   */
  async getMyComplaints(): Promise<ApiResponse<Complaint[]>> {
    return apiClient.get<Complaint[]>("/citizen/complaints");
  },

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
   * GET /api/v1/citizen/gifts/redemptions?type=EARN|SPEND|REFUND
   * @param type - Optional filter by transaction type (EARN, SPEND, REFUND)
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
